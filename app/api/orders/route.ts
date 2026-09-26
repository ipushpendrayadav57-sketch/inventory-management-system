import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(){
  return NextResponse.json(await db.order.findMany({
    include:{items:{include:{product:true}},warehouse:true},
    orderBy:{createdAt:"desc"}
  }));
}

export async function POST(req:Request){
  try{
    const b=await req.json();
    if(!b.channel||!Array.isArray(b.items)||!b.items.length)
      return NextResponse.json({error:"channel and items are required"},{status:400});
    const orderNumber=b.orderNumber||("ORD-"+Date.now());
    const total=b.items.reduce((s:any,i:any)=>s+Number(i.quantity)*Number(i.unitPrice),0);
    const order=await db.$transaction(async (tx: Prisma.TransactionClient)=>{
      if(b.warehouseId){
        for(const i of b.items){
          const p=await tx.product.findUnique({where:{id:i.productId}});
          if(!p)throw new Error("Product not found");
          const bal=await tx.stockBalance.findUnique({where:{productId_warehouseId:{productId:i.productId,warehouseId:b.warehouseId}}});
          if(!bal||bal.quantity-bal.reserved<Number(i.quantity))throw new Error("Insufficient available stock for "+p.sku);
          await tx.stockBalance.update({where:{id:bal.id},data:{reserved:{increment:Number(i.quantity)}}});
        }
      }
      return tx.order.create({
        data:{orderNumber,channel:b.channel,status:"NEW",warehouseId:b.warehouseId,customerName:b.customerName,total,externalId:b.externalId,
          items:{create:b.items.map((i:any)=>({productId:i.productId,quantity:Number(i.quantity),unitPrice:Number(i.unitPrice)}))}},
        include:{items:true}
      });
    });
    return NextResponse.json(order,{status:201});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Unable to create order"},{status:400});
  }
}
