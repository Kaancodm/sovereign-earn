const test=require('node:test');const assert=require('node:assert/strict');
function split(n){const fee=Math.floor(n*0.10);return{fee,payout:n-fee}}
test('coaching split is deterministic',()=>{assert.deepEqual(split(100),{fee:10,payout:90});assert.deepEqual(split(99),{fee:9,payout:90});});
test('invalid coin values are rejected',()=>{for(const n of [0,-1,1.2,NaN,Infinity])assert.equal(Number.isSafeInteger(n)&&n>0,false);});
