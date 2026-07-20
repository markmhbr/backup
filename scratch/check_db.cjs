const { Client } = require('pg');
async function main() {
  const client = new Client({
    host: 'localhost',
    port: 54532,
    database: 'pendataan',
    user: 'postgres',
    password: '',
  });
  await client.connect();
  const res = await client.query("SELECT nama, nama_ayah, pekerjaan_id_ayah, penghasilan_id_ayah, jenjang_pendidikan_ayah, nik_ayah FROM peserta_didik WHERE nama_ayah ILIKE '%AEPSAHPUDIN%' LIMIT 5");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
