import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";

export async function GET(){
  let warehouses=await db.warehouse.findMany({
    include:{stock:{include:{product:true}}},
    orderBy:{name:"asc"}
  });

  // Keep the first installation usable even when the database was created
  // without running the seed script.
  if(warehouses.length===0){
    await db.warehouse.create({
      data:{code:"WH01",name:"Main Warehouse",city:"Faridabad"}
    });
    warehouses=await db.warehouse.findMany({
      include:{stock:{include:{product:true}}},
      orderBy:{name:"asc"}
    });
  }

  return NextResponse.json(warehouses);
}

export async function POST(req:Request){
  try{
    const b=await req.json();
    if(!b.code||!b.name){
      return NextResponse.json({error:"code and name are required"},{status:400});
    }
    return NextResponse.json(
      await db.warehouse.create({data:{code:b.code,name:b.name,city:b.city}}),
      {status:201}
    );
  }catch(e){
    return NextResponse.json(
      {error:e instanceof Error?e.message:"Unable to create warehouse"},
      {status:500}
    );
  }
}