import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {moveStock} from "@/lib/inventory";
export async function POST(req:Request){
 try{
  const b=await req.json(); if(!b.productId||!b.warehouseId||!b.quantity)return NextResponse.json({error:"productId, warehouseId and quantity are required"},{status:400});
  const qty=Number(b.quantity); if(qty<=0)return NextResponse.json({error:"Quantity must be positive"},{status:400});
  if(b.restock!==false) await moveStock({productId:b.productId,warehouseId:b.warehouseId,type:"CUSTOMER_RETURN",quantity:qty,unitCost:Number(b.unitCost||0),reference:b.reference||"RETURN",notes:b.reason||"Customer return"});
  return NextResponse.json({ok:true,restocked:b.restock!==false},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to process return"},{status:500})}
}