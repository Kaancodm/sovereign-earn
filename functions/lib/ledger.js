const { FieldValue } = require('firebase-admin/firestore');
const COIN_FIELD='coinBalance'; const FEE_BPS=1000;
function finitePositive(value){const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;}
function calculateSplit(escrow){const amount=finitePositive(escrow);if(amount===null)throw new Error('Invalid escrow amount');const fee=Math.floor(amount*FEE_BPS/10000);return{fee,payout:amount-fee};}
function ledgerEntry({uid,type,amount,referenceId,metadata={}}){return{uid,type,amount,referenceId,metadata,createdAt:FieldValue.serverTimestamp()};}
module.exports={COIN_FIELD,FEE_BPS,calculateSplit,ledgerEntry};
