import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
async function main(){
 const warehouse=await db.warehouse.upsert({where:{code:"WH01"},update:{},create:{code:"WH01",name:"Main Warehouse",city:"Faridabad"}});
 const products=[["VON-001","Vondex Classic Watch","Watches",310,799,148],["NID-BLT-021","Premium Leather Belt","Belts",220,599,31],["RR-SOAP-014","RootedRitual Herbal Soap","Personal Care",82,249,0],["VON-017","Vondex Chrono Black","Watches",520,1299,67],["HM-BAG-008","Luxury Hand Bag","Bags",780,1899,22]] as const;
 for(const [sku,name,category,cost,sellingPrice,quantity] of products){
  const p=await db.product.upsert({where:{sku},update:{name,category,costPrice:cost,sellingPrice,mrp:sellingPrice,reorderLevel:20},create:{sku,name,category,costPrice:cost,sellingPrice,mrp:sellingPrice,reorderLevel:20,gstRate:18}});
  await db.stockBalance.upsert({where:{productId_warehouseId:{productId:p.id,warehouseId:warehouse.id}},update:{quantity},create:{productId:p.id,warehouseId:warehouse.id,quantity}});
 }
}
main().finally(()=>db.$disconnect());