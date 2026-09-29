import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {moveStock} from "@/lib/inventory";

export async function GET(){
  return NextResponse.json(await db.stockMovement.findMany({
    include:{product:true,warehouse:true},
    orderBy:{createdAt:"desc"},
    take:200
  }));
}

export async function POST(req:Request){
  try{
    const body=await req.json();
    const movement=await moveStock(body);
    return NextResponse.json(movement,{status:201});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Stock movement failed"},{status:400});
  }
}