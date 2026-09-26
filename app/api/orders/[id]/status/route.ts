import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const b=await req.json();
    const order=await db.order.findUnique({where:{id},include:{items:true}});
    if(!order)return NextResponse.json({error:"Order not found"},{status:404});
    const next=b.status;
    if(next==="SHIPPED"&&order.status!=="SHIPPED"){
      if(!order.warehouseId)throw new Error("Order has no warehouse");
      await db.$transaction(async (tx: Prisma.TransactionClient)=>{
        for(const i of order.items){
          const bal=await tx.stockBalance.findUnique({where:{productId_warehouseId:{productId:i.productId,warehouseId:order.warehouseId!}}});
          if(!bal||bal.quantity<i.quantity)throw new Error("Insufficient stock");
          await tx.stockBalance.update({where:{id:bal.id},data:{quantity:{decrement:i.quantity},reserved:{decrement:i.quantity}}});
          const product=await tx.product.findUniqueOrThrow({where:{id:i.productId}});
          await tx.stockMovement.create({data:{productId:i.productId,warehouseId:order.warehouseId!,type:"SALE",quantity:i.quantity,unitCost:product.costPrice,reference:order.orderNumber}});
        }
        await tx.order.update({where:{id},data:{status:next}});
      });
    }else{
      await db.order.update({where:{id},data:{status:next}});
    }
    return NextResponse.json({ok:true,status:next});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Status update failed"},{status:400});
  }
}
