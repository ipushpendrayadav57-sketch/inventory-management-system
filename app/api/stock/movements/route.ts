import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
export async function GET(req:Request){
 const u=new URL(req.url); const sku=u.searchParams.get("sku")||undefined;
 const rows=await db.stockMovement.findMany({where:sku?{product:{sku:{contains:sku,mode:"insensitive"}}}:undefined,include:{product:true,warehouse:true},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json(rows);
}