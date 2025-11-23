import 'dotenv/config';
import { writeFileSync } from 'fs';

const testWorkOrders = async () => {
  const response = await fetch(`${process.env.SHOPMONKEY_BASE_URL}/order`, {
    headers: {
      'Authorization': `Bearer ${process.env.SHOPMONKEY_API_KEY}`
    }
  });
  
  const data = await response.json();
  writeFileSync('shopmonkey-response.json', JSON.stringify(data, null, 2));
  console.log('Response saved to shopmonkey-response.json');
};

testWorkOrders();