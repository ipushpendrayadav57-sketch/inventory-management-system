import {db} from "./prisma";
import type { Prisma } from "@prisma/client";

export async function moveStock(input:{
  sku?:string;
  productId?:string;
  warehouseCode?:string;
  warehouseId?:string;
  quantity:number;
  type:"PURCHASE"|"SALE"|"CUSTOMER_RETURN"|"PURCHASE_RETURN"|"TRANSFER_IN"|"TRANSFER_OUT"|"ADJUSTMENT_IN"|"ADJUSTMENT_OUT"|"DAMAGE";
  reference?:string;
  notes?:string;
  unitCost?:number;
}){
  if(input.quantity<=0)throw new Error("Quantity must be greater than zero");
  if(!input.sku&&!input.productId)throw new Error("Product is required");
  if(!input.warehouseCode&&!input.warehouseId)throw new Error("Warehouse is required");

  return db.$transaction(async (tx: Prisma.TransactionClient)=>{
    const product=input.productId
      ? await tx.product.findUnique({where:{id:input.productId}})
      : await tx.product.findUnique({where:{sku:input.sku}});
    const warehouse=input.warehouseId
      ? await tx.warehouse.findUnique({where:{id:input.warehouseId}})
      : await tx.warehouse.findUnique({where:{code:input.warehouseCode}});

    if(!product||!warehouse)throw new Error("Product or warehouse not found");

    const outbound=["SALE","PURCHASE_RETURN","TRANSFER_OUT","ADJUSTMENT_OUT","DAMAGE"].includes(input.type);
    const balance=await tx.stockBalance.upsert({
      where:{productId_warehouseId:{productId:product.id,warehouseId:warehouse.id}},
      update:{},
      create:{productId:product.id,warehouseId:warehouse.id,quantity:0}
    });

    if(outbound&&balance.quantity<input.quantity)throw new Error("Insufficient available stock");

    await tx.stockBalance.update({
      where:{id:balance.id},
      data:{quantity:balance.quantity+(outbound?-input.quantity:input.quantity)}
    });

    return tx.stockMovement.create({
      data:{
        productId:product.id,
        warehouseId:warehouse.id,
        type:input.type,
        quantity:input.quantity,
        unitCost:input.unitCost,
        reference:input.reference,
        notes:input.notes
      }
    });
  });
}
