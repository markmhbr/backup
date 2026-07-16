import Swal from "sweetalert2";
import { dapodikService } from "../services/dapodikService";
import { indisiplinerService } from "../services/indisiplinerService";
import { presensiService } from "../services/presensiService";
import { getFotoUrl } from "./image";

export const printRapor = async (studentId: string, rombelInfo: any) => {
  try {
    Swal.fire({
      title: "Mempersiapkan Rapor...",
      text: "Mohon tunggu sementara data sedang dimuat.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 1. Fetch School & Student Detail
    const [sekolahRes, studentRes] = await Promise.all([
      dapodikService.getSekolah(),
      dapodikService.getPesertaDidikDetail(studentId),
    ]);

    const sekolah = sekolahRes.data || {};
    const student = studentRes.data || {};

    const rombel = student.rombongan_belajar || 
                   student.anggota_rombel?.[0]?.rombongan_belajar || 
                   rombelInfo || {};
    const rombelId = rombel.rombongan_belajar_id;
    const rombelName = rombel.nama || "-";

    // 2. Fetch Pembelajaran/Mapel
    let pembelajaranList: any[] = [];
    if (rombelId) {
      try {
        const pembRes = await dapodikService.getRombelPembelajaran(rombelId);
        pembelajaranList = pembRes.data || [];
      } catch (e) {
        console.error("Gagal memuat data pembelajaran:", e);
      }
    }

    // 3. Fetch Violations (Indisipliner)
    let indisiplinerList: any[] = [];
    let totalPoin = 0;
    if (sekolah.sekolah_id && student.nipd) {
      try {
        const violRes = await indisiplinerService.getPelanggaran(sekolah.sekolah_id, {
          peserta_didik_id: studentId,
        });
        indisiplinerList = Array.isArray(violRes) ? violRes : (violRes?.data || []);
        totalPoin = indisiplinerList.reduce((acc, curr) => acc + (curr.poin || 0), 0);
      } catch (e) {
        console.error("Gagal memuat data pelanggaran:", e);
      }
    }

    // 4. Fetch Attendance Summary
    const rekapAbsensi = { sakit: 0, izin: 0, alfa: 0 };
    if (sekolah.sekolah_id && rombelName) {
      try {
        const start = rombel.tanggal_mulai 
          ? rombel.tanggal_mulai.substring(0, 10) 
          : `${new Date().getFullYear()}-07-01`;
        const end = rombel.tanggal_selesai 
          ? rombel.tanggal_selesai.substring(0, 10) 
          : `${new Date().getFullYear()}-12-31`;
          
        const attRes = await presensiService.getRekapPeriodik(
          sekolah.sekolah_id,
          rombelName,
          start,
          end,
          "pd"
        );
        const myAtt = attRes.data?.find((item: any) => item.peserta_didik_id === studentId);
        if (myAtt) {
          const countedDates = new Set<string>();

          // Parse presensi records
          // status_masuk mapping: 3=Izin, 4=Sakit, 5=Alpha
          if (Array.isArray(myAtt.presensi)) {
            myAtt.presensi.forEach((p: any) => {
              if (!p.tanggal) return;
              const dateStr = new Date(p.tanggal).toISOString().split('T')[0];
              if (p.status_masuk === 4) {
                rekapAbsensi.sakit++;
                countedDates.add(dateStr);
              } else if (p.status_masuk === 3) {
                rekapAbsensi.izin++;
                countedDates.add(dateStr);
              } else if (p.status_masuk === 5) {
                rekapAbsensi.alfa++;
                countedDates.add(dateStr);
              }
            });
          }

          // Parse izin records for days not covered by presensi
          // jenis mapping: 4=Izin, 5=Sakit, 6=Alpha
          if (Array.isArray(myAtt.izin)) {
            myAtt.izin.forEach((i: any) => {
              if (!i.tanggal) return;
              const dateStr = new Date(i.tanggal).toISOString().split('T')[0];
              if (countedDates.has(dateStr)) return;

              if (i.jenis === 5) {
                rekapAbsensi.sakit++;
                countedDates.add(dateStr);
              } else if (i.jenis === 4) {
                rekapAbsensi.izin++;
                countedDates.add(dateStr);
              } else if (i.jenis === 6) {
                rekapAbsensi.alfa++;
                countedDates.add(dateStr);
              }
            });
          }
        }
      } catch (e) {
        console.error("Gagal memuat rekap absensi:", e);
      }
    }

    Swal.close();

    // 5. Open Print Window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire("Gagal", "Popup blocker aktif. Mohon izinkan popup untuk mencetak.", "error");
      return;
    }

    // Prepare Date string
    const todayFormatted = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const studentPhoto = getFotoUrl(student.foto);
    const schoolLogo = getFotoUrl(sekolah.logo, "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png");

    // Map level name dynamically
    let bentukPendidikan = sekolah.bentuk_pendidikan_id_str || "";
    if (bentukPendidikan === "SMK") bentukPendidikan = "SEKOLAH MENENGAH KEJURUAN";
    else if (bentukPendidikan === "SMA") bentukPendidikan = "SEKOLAH MENENGAH ATAS";
    else if (bentukPendidikan === "SMP") bentukPendidikan = "SEKOLAH MENENGAH PERTAMA";
    else if (bentukPendidikan === "SD") bentukPendidikan = "SEKOLAH DASAR";

    const alamatSiswa = `${student.alamat_jalan || "-"}, RT ${student.rt || "0"}/RW ${student.rw || "0"}, Dusun ${student.dusun || "-"}, Kel. ${student.desa_kelurahan || "-"}, Kec. ${student.kecamatan || "-"}, Kab. ${student.kabupaten_kota || student.kabupaten || "-"}, Prov. ${student.provinsi || "-"} ${student.kode_pos || ""}`;

    // Get Fase based on grade
    const grade = rombel.tingkat_pendidikan_id ? Number(rombel.tingkat_pendidikan_id) : 10;
    let faseStr = "-";
    if (grade === 10) faseStr = "E";
    else if (grade === 11 || grade === 12) faseStr = "F";

    const semester = rombel.semester_id ? (rombel.semester_id.endsWith("1") ? "Ganjil" : "Genap") : "-";
    const tahunAjaran = rombel.semester_id ? `${rombel.semester_id.substring(0, 4)}/${Number(rombel.semester_id.substring(0, 4)) + 1}` : "-";

    const ekskulList = student.anggota_rombel
      ?.filter((item: any) => Number(item.rombongan_belajar?.jenis_rombel) === 51)
      ?.map((item: any) => item.rombongan_belajar?.nama) || [];


    const umumList = pembelajaranList.filter(
      (item: any) => !item.jurusan_id || item.jurusan_id === "000000000" || item.jurusan_id === ""
    );
    const jurusanList = pembelajaranList.filter(
      (item: any) => item.jurusan_id && item.jurusan_id !== "000000000" && item.jurusan_id !== ""
    );

    const page1Html = `
            <div class="cover-container">
                <div class="text-center">
                    <img src="${schoolLogo}" alt="Logo Sekolah">
                </div>
                
                <div class="text-center text1">
                    <h3>RAPOR PESERTA DIDIK</h3>
                    <h3>${bentukPendidikan}</h3>
                    <h3>(${sekolah.bentuk_pendidikan_id_str || "-"})</h3>
                </div>

                <div class="text-center">
                    <p style="font-size: 12px;">Nama Peserta Didik:</p>
                    <div style="border: 1px solid #000; padding: 10px; display: inline-block; min-width: 300px; font-size: 16px; font-weight: bold;" class="uppercase">
                        ${student.nama || "-"}
                    </div>
                    
                    <p style="margin-top: 50px; font-size: 12px;">NISN:</p>
                    <div style="border: 1px solid #000; padding: 10px; display: inline-block; min-width: 300px; font-size: 16px; font-weight: bold;" class="uppercase">
                        ${student.nisn || "-"}
                    </div>
                </div>

                <div class="text-center" style="margin-top: 60px; margin-bottom: 20px;">
                    <h3 class="font-bold uppercase" style="font-size: 13px; line-height: 1.4; margin: 0;">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH<br>REPUBLIK INDONESIA</h3>
                </div>
            </div>
    `;

    const page2Html = `
            <h4 class="text-center font-bold uppercase" style="margin-bottom: 30px;">RAPOR PESERTA DIDIK <br> ${bentukPendidikan} <br> (${sekolah.bentuk_pendidikan_id_str || "-"})</h4>
            
            <table class="info-table school-info-table" style="margin-top: 50px;">
                <tr>
                    <td class="info-label">Nama Sekolah</td>
                    <td class="info-separator">:</td>
                    <td><b>${sekolah.nama || "-"}</b></td>
                </tr>
                <tr>
                    <td>NPSN / NSS</td>
                    <td>:</td>
                    <td>${sekolah.npsn || "-"} / ${sekolah.nss || "-"}</td>
                </tr>
                <tr>
                    <td>Alamat Sekolah</td>
                    <td>:</td>
                    <td>${sekolah.alamat_jalan || "-"}</td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td>Kode Pos: ${sekolah.kode_pos || "-"}, Telp: ${sekolah.nomor_telepon || "-"}</td>
                </tr>
                <tr>
                    <td>Kelurahan</td>
                    <td>:</td>
                    <td>${sekolah.desa_kelurahan || "-"}</td>
                </tr>
                <tr>
                    <td>Kecamatan</td>
                    <td>:</td>
                    <td>${sekolah.kecamatan || "-"}</td>
                </tr>
                <tr>
                    <td>Kabupaten/Kota</td>
                    <td>:</td>
                    <td>${sekolah.kabupaten || sekolah.kabupaten_kota || "-"}</td>
                </tr>
                <tr>
                    <td>Provinsi</td>
                    <td>:</td>
                    <td>${sekolah.provinsi || "-"}</td>
                </tr>
                <tr>
                    <td>Website</td>
                    <td>:</td>
                    <td>${sekolah.website || "-"}</td>
                </tr>
                <tr>
                    <td>Email</td>
                    <td>:</td>
                    <td>${sekolah.email || "-"}</td>
                </tr>
            </table>

            <div class="footer-note">
                <span>${student.nama || ""} | ${rombelName}</span>
                <span>Halaman 2</span>
            </div>
    `;

    const page3Html = `
            <h3 class="text-center font-bold uppercase" style="margin-bottom: 25px;">KETERANGAN TENTANG DIRI PESERTA DIDIK</h3>
            
            <table class="info-table">
                <tr><td style="width: 25px;">1.</td><td class="info-label">Nama Lengkap</td><td class="info-separator">:</td><td><b>${student.nama || "-"}</b></td></tr>
                <tr><td>2.</td><td>Nomor Induk/NISN</td><td>:</td><td>${student.nipd || "-"} / ${student.nisn || "-"}</td></tr>
                <tr><td>3.</td><td>Tempat, Tanggal Lahir</td><td>:</td><td>${student.tempat_lahir || "-"}, ${student.tanggal_lahir ? new Date(student.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</td></tr>
                <tr><td>4.</td><td>Jenis Kelamin</td><td>:</td><td>${student.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
                <tr><td>5.</td><td>Agama</td><td>:</td><td>${student.agama_nama || student.agama_id_str || "-"}</td></tr>
                <tr><td>6.</td><td>Status dalam Keluarga</td><td>:</td><td>${student.status_dalam_keluarga || "Anak Kandung"}</td></tr>
                <tr><td>7.</td><td>Anak ke</td><td>:</td><td>${student.anak_keberapa || "-"}</td></tr>
                <tr><td>8.</td><td>Alamat Peserta Didik</td><td>:</td><td>${alamatSiswa}</td></tr>
                <tr><td>9.</td><td>Nomor Telepon Rumah</td><td>:</td><td>${student.nomor_telepon_seluler || "-"}</td></tr>
                <tr><td>10.</td><td>Sekolah Asal</td><td>:</td><td>${student.sekolah_asal || "-"}</td></tr>
                <tr><td>11.</td><td>Diterima di Sekolah Ini</td><td></td><td></td></tr>
                <tr><td></td><td style="padding-left: 20px;">a. Di kelas</td><td>:</td><td>${rombelName}</td></tr>
                <tr><td></td><td style="padding-left: 20px;">b. Pada tanggal</td><td>:</td><td>${student.tanggal_masuk_sekolah ? new Date(student.tanggal_masuk_sekolah).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</td></tr>
                <tr><td>12.</td><td>Nama Orang Tua</td><td></td><td></td></tr>
                <tr><td></td><td style="padding-left: 20px;">a. Ayah</td><td>:</td><td>${student.nama_ayah || "-"}</td></tr>
                <tr><td></td><td style="padding-left: 20px;">b. Ibu</td><td>:</td><td>${student.nama_ibu_kandung || student.nama_ibu || "-"}</td></tr>
                <tr><td>13.</td><td>Alamat Orang Tua</td><td>:</td><td>${alamatSiswa}</td></tr>
                <tr><td>14.</td><td>Pekerjaan Orang Tua</td><td></td><td></td></tr>
                <tr><td></td><td style="padding-left: 20px;">a. Ayah</td><td>:</td><td>${student.pekerjaan_ayah_nama || student.pekerjaan_ayah_id_str || "-"}</td></tr>
                <tr><td></td><td style="padding-left: 20px;">b. Ibu</td><td>:</td><td>${student.pekerjaan_ibu_nama || student.pekerjaan_ibu_id_str || "-"}</td></tr>
                <tr><td>15.</td><td>Wali Peserta Didik</td><td>:</td><td>${student.nama_wali || "-"}</td></tr>
                <tr><td>16.</td><td>Alamat Wali</td><td>:</td><td>${student.alamat_wali || "-"}</td></tr>
                <tr><td>17.</td><td>Pekerjaan Wali</td><td>:</td><td>${student.pekerjaan_wali_nama || student.pekerjaan_wali_id_str || "-"}</td></tr>
            </table>

            <div style="margin-top: 30px;">
                <div style="float: left; width: 120px; height: 160px; border: 1px solid #000; text-align: center; line-height: 160px; margin-left: 30px;">
                    ${studentPhoto ? `<img src="${studentPhoto}" style="width: 100%; height: 100%; object-fit: cover;">` : "FOTO 3 X 4"}
                </div>
                <div style="float: right; width: 250px; text-align: left;">
                    <p>${sekolah.kabupaten || sekolah.kabupaten_kota || "-"}, ${todayFormatted}<br>Kepala Sekolah,</p>
                    <br><br><br>
                    <p class="font-bold" style="text-decoration: underline;">${sekolah.nama_kepala_sekolah || "(..........................................)"}</p>
                    <p>NIP. ${sekolah.nip_kepala_sekolah || "-"}</p>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div class="footer-note">
                <span>${student.nama || ""} | ${rombelName}</span>
                <span>Halaman 3</span>
            </div>
    `;

    const page4Html = `
            <h4 class="text-center font-bold uppercase">CAPAIAN KOMPETENSI</h4>
            
            <table class="header-meta" style="margin-top: 15px;">
                <tr>
                    <td class="header-meta-label">Nama Peserta Didik</td>
                    <td style="width: 10px;">:</td>
                    <td><b>${student.nama || "-"}</b></td>
                    <td class="header-meta-label" style="padding-left: 40px;">Kelas</td>
                    <td style="width: 10px;">:</td>
                    <td>${rombelName}</td>
                </tr>
                <tr>
                    <td>Nomor Induk/NISN</td>
                    <td>:</td>
                    <td>${student.nipd || "-"} / ${student.nisn || "-"}</td>
                    <td style="padding-left: 40px;">Fase</td>
                    <td>:</td>
                    <td>${faseStr}</td>
                </tr>
                <tr>
                    <td>Sekolah</td>
                    <td>:</td>
                    <td>${sekolah.nama || "-"}</td>
                    <td style="padding-left: 40px;">Semester</td>
                    <td>:</td>
                    <td>${semester}</td>
                </tr>
                <tr>
                    <td>Alamat</td>
                    <td>:</td>
                    <td>${sekolah.alamat_jalan || "-"}</td>
                    <td style="padding-left: 40px;">Tahun Pelajaran</td>
                    <td>:</td>
                    <td>${tahunAjaran}</td>
                </tr>
            </table>

            <table class="table-bordered" style="margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th width="5%">No</th>
                        <th width="45%">Mata Pelajaran</th>
                        <th width="15%">Nilai Akhir</th>
                        <th>Capaian Kompetensi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" class="font-bold" style="background-color: #fafafa;">A. Umum</td>
                    </tr>
                    ${
                      umumList.length === 0
                        ? `<tr><td colspan="4" class="text-center" style="padding: 10px; color: #777;">Tidak ada mata pelajaran umum</td></tr>`
                        : umumList
                            .map(
                              (item, idx) => `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td>${item.nama_mata_pelajaran || ""}</td>
                            <td class="text-center"></td>
                            <td></td>
                        </tr>
                    `
                            )
                            .join("")
                    }
                    <tr>
                        <td colspan="4" class="font-bold" style="background-color: #fafafa;">B. Kejuruan / Jurusan</td>
                    </tr>
                    ${
                      jurusanList.length === 0
                        ? `<tr><td colspan="4" class="text-center" style="padding: 10px; color: #777;">Tidak ada mata pelajaran kejuruan/jurusan</td></tr>`
                        : jurusanList
                            .map(
                              (item, idx) => `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td>${item.nama_mata_pelajaran || ""}</td>
                            <td class="text-center"></td>
                            <td></td>
                        </tr>
                    `
                            )
                            .join("")
                    }
                </tbody>
            </table>

            <div class="footer-note">
                <span>${student.nama || ""} | ${rombelName}</span>
                <span>Halaman 4</span>
            </div>
    `;

    const page5Html = `
            <h4 class="text-center font-bold uppercase">CATATAN & KETIDAKHADIRAN</h4>
            
            <!-- Ekstrakurikuler Table -->
            <h5 class="font-bold" style="margin: 10px 0 5px 0;">A. Ekstrakurikuler</h5>
            <table class="table-bordered">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th width="5%">No</th>
                        <th width="55%">Kegiatan Ekstrakurikuler</th>
                        <th width="40%">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      ekskulList.length === 0
                        ? `<tr><td colspan="3" class="text-center" style="padding: 10px;">Tidak ada catatan ekstrakurikuler.</td></tr>`
                        : ekskulList
                            .map(
                              (ekskul: any, idx: number) => `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td>${ekskul || ""}</td>
                            <td></td>
                        </tr>
                    `
                            )
                            .join("")
                    }
                </tbody>
            </table>

            <!-- Indisipliner (Violations) -->
            <h5 class="font-bold" style="margin: 15px 0 5px 0;">B. Catatan Pelanggaran Indisipliner</h5>
            <table class="table-bordered">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th width="5%">No</th>
                        <th width="75%">Nama Pelanggaran</th>
                        <th width="20%">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      indisiplinerList.length === 0
                        ? `<tr><td colspan="3" class="text-center" style="padding: 10px;">Tidak ada catatan pelanggaran.</td></tr>`
                        : indisiplinerList
                            .map(
                              (item, idx) => `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td>${item.jenis_pelanggaran?.nama || item.keterangan || "Pelanggaran"}</td>
                            <td class="text-center">${item.jenis_pelanggaran?.poin || item.poin || 0}</td>
                        </tr>
                    `
                            )
                            .join("")
                    }
                </tbody>
                ${
                  indisiplinerList.length > 0
                    ? `
                <tfoot>
                    <tr class="font-bold">
                        <td colspan="2" class="text-right">Total Poin Pelanggaran:</td>
                        <td class="text-center">${totalPoin}</td>
                    </tr>
                </tfoot>
                `
                    : ""
                }
            </table>

            <!-- Kehadiran & Catatan Wali -->
            <div style="margin-top: 15px; display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <h5 class="font-bold" style="margin: 0 0 5px 0;">C. Ketidakhadiran</h5>
                    <table class="table-bordered">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th colspan="2">Ketidakhadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td width="60%">Sakit</td>
                                <td class="text-center">${rekapAbsensi.sakit} hari</td>
                            </tr>
                            <tr>
                                <td>Izin</td>
                                <td class="text-center">${rekapAbsensi.izin} hari</td>
                            </tr>
                            <tr>
                                <td>Tanpa Keterangan</td>
                                <td class="text-center">${rekapAbsensi.alfa} hari</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="flex: 1.2;">
                    <h5 class="font-bold" style="margin: 0 0 5px 0;">D. Catatan Wali Kelas</h5>
                    <div style="border: 1px solid #000; padding: 10px; min-height: 80px; font-style: italic; font-size: 11px;">
                        Teruslah berkembang, teruslah berjuang, jangan pernah merasa puas dengan pencapaian hari ini. Masa sekolah bukan akhir perjuangan, jadilah pribadi yang haus ilmu.
                    </div>
                </div>
            </div>

            <!-- Tanggapan Orang Tua -->
            <h5 class="font-bold" style="margin: 15px 0 5px 0;">E. Tanggapan Orang Tua/Wali Murid</h5>
            <div style="border: 1px solid #000; padding: 10px; min-height: 60px;"></div>

            <!-- Signatures Section -->
            <div style="margin-top: 40px;">
                <div style="float: left; width: 200px; text-align: center;">
                    <p>Orang Tua/Wali</p>
                    <br><br><br>
                    <p>..........................................</p>
                </div>
                
                <div style="float: right; width: 220px; text-align: center;">
                    <p>${sekolah.kabupaten || sekolah.kabupaten_kota || "-"}, ${todayFormatted}<br>Wali Kelas</p>
                    <br><br><br>
                    <p class="font-bold" style="text-decoration: underline;">${rombel.ptk_id_str || "(..........................................)"}</p>
                    <p>NIP. -</p>
                </div>
                <div style="clear: both;"></div>
                
                <table style="width: 100%; margin-top: 25px; border: none; text-align: center;">
                    <tr>
                        <td width="35%"></td>
                        <td width="65%">
                            <p>Mengetahui,<br>Kepala Sekolah</p>
                            <br><br><br>
                            <p class="font-bold" style="text-decoration: underline;">${sekolah.nama_kepala_sekolah || "(..........................................)"}</p>
                            <p>NIP. ${sekolah.nip_kepala_sekolah || "-"}</p>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="footer-note">
                <span>${student.nama || ""} | ${rombelName}</span>
                <span>Halaman 5</span>
            </div>
    `;

    const pages = [page1Html, page2Html, page3Html, page4Html, page5Html];
    const pagesHtml = pages.map((page, idx) => `<div class="page-container" id="page-container-${idx + 1}">${page}</div>`).join("");
    const thumbnailsHtml = pages.map((page, idx) => `
        <div class="thumbnail-wrapper" onclick="goToPage(${idx + 1})">
            <div class="thumbnail-container" id="thumbnail-${idx + 1}">
                <div class="thumbnail-page">
                    <div class="page-container">${page}</div>
                </div>
            </div>
            <div class="thumbnail-number">${idx + 1}</div>
        </div>
    `).join("");

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cetak Rapor - ${student.nama || "Siswa"}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            color: #000;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        
        /* screen view styles */
        @media screen {
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #323639;
            }
            body {
                display: flex;
                flex-direction: column;
            }
            .pdf-toolbar {
                height: 56px;
                background-color: #323639;
                color: #f1f1f1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                box-sizing: border-box;
                border-bottom: 1px solid #1c1f21;
                z-index: 100;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
            }
            .pdf-title-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .pdf-hamburger {
                background: none;
                border: none;
                color: #f1f1f1;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                border-radius: 50%;
                outline: none;
            }
            .pdf-hamburger:hover {
                background-color: rgba(255,255,255,0.1);
            }
            .pdf-title {
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 300px;
            }
            .pdf-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                background-color: #202124;
                padding: 4px 16px;
                border-radius: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            .pdf-control-btn {
                background: none;
                border: none;
                color: #bdc1c6;
                cursor: pointer;
                font-size: 20px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                outline: none;
                transition: background-color 0.2s, color 0.2s;
            }
            .pdf-control-btn:hover {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            .pdf-page-indicator {
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #bdc1c6;
            }
            .pdf-page-input {
                width: 36px;
                background-color: #35363a;
                border: 1px solid #5f6368;
                color: white;
                text-align: center;
                font-size: 13px;
                padding: 3px 0;
                border-radius: 4px;
                outline: none;
            }
            .pdf-page-input:focus {
                border-color: #8ab4f8;
            }
            .pdf-zoom-text {
                font-size: 13px;
                min-width: 48px;
                text-align: center;
                color: #bdc1c6;
            }
            .pdf-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .pdf-btn {
                background: none;
                border: none;
                color: #f1f1f1;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                outline: none;
                transition: background-color 0.2s;
            }
            .pdf-btn:hover {
                background-color: rgba(255,255,255,0.1);
            }
            .pdf-btn svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }
            .pdf-content-wrapper {
                display: flex;
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            .pdf-sidebar {
                width: 200px;
                background-color: #323639;
                border-right: 1px solid #1c1f21;
                overflow-y: auto;
                padding: 20px 10px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                transition: width 0.2s;
            }
            .pdf-main-pane {
                flex: 1;
                background-color: #525659;
                overflow-y: auto;
                padding: 24px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                scroll-behavior: smooth;
            }
            .page-container {
                width: 210mm;
                height: 297mm;
                margin-bottom: 24px;
                background: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2);
                padding: 20mm 20mm;
                box-sizing: border-box;
                position: relative;
                border-radius: 2px;
                flex-shrink: 0;
                transform-origin: top center;
                zoom: var(--pdf-zoom, 1);
            }
            .thumbnail-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                width: 100%;
            }
            .thumbnail-container {
                width: 110px;
                height: 156px;
                border: 3px solid transparent;
                border-radius: 4px;
                background-color: #fff;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                transition: border-color 0.2s, transform 0.2s;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .thumbnail-container:hover {
                transform: translateY(-2px);
                border-color: rgba(255,255,255,0.2);
            }
            .thumbnail-container.active {
                border-color: #8ab4f8;
                box-shadow: 0 0 0 1px #8ab4f8, 0 4px 12px rgba(0,0,0,0.4);
            }
            .thumbnail-page {
                width: 210mm;
                height: 297mm;
                transform: scale(0.138);
                transform-origin: top left;
                pointer-events: none;
                position: absolute;
                top: 0;
                left: 0;
                background: white;
            }
            .thumbnail-page .page-container {
                zoom: 1 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
                padding: 20mm 20mm !important;
            }
            .thumbnail-number {
                color: #bdc1c6;
                font-size: 12px;
                font-family: Arial, sans-serif;
                font-weight: 500;
            }
        }

        /* print mode styles */
        @media print {
            html, body {
                background-color: white !important;
                overflow: visible !important;
                height: auto !important;
            }
            .pdf-toolbar, .pdf-sidebar {
                display: none !important;
            }
            .pdf-content-wrapper {
                display: block !important;
                overflow: visible !important;
            }
            .pdf-main-pane {
                display: block !important;
                overflow: visible !important;
                padding: 0 !important;
                background-color: transparent !important;
            }
            .page-container {
                width: 210mm !important;
                height: auto !important;
                min-height: 297mm !important;
                padding: 20mm 20mm !important;
                box-sizing: border-box !important;
                position: relative !important;
                page-break-after: always !important;
                background: transparent !important;
                box-shadow: none !important;
                margin: 0 !important;
            }
        }

        /* Layout Elements */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .table-bordered th, .table-bordered td { border: 1px solid #000; padding: 6px; }
        
        /* Cover styling */
        .cover-container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            border: 1px solid #084b8a;
            outline: 1px solid #084b8a;
            outline-offset: 2px;
            padding: 20px;
            box-sizing: border-box;
        }
        .cover-container img {
            margin-top: 25px;
            max-height: 150px;
        }
        .cover-container .text1 {
            font-weight: 100;
            margin-top: 50px;
            margin-bottom: 100px;
        }
        .cover-container .text1 h3 {
            font-size: 18px;
            margin: 5px 0;
            font-weight: bold;
        }

        /* Header info table */
        .info-table td { padding: 4px 0; vertical-align: top; }
        .school-info-table td { padding: 20px 5px; vertical-align: top; }
        .school-info-table .info-label { width: 180px; }
        .info-label { width: 150px; }
        .info-separator { width: 15px; text-align: center; }

        /* Report details table header */
        .header-meta td { padding: 3px 0; font-size: 11px; }
        .header-meta-label { width: 120px; }

        /* Footer margin and page number */
        .footer-note {
            position: absolute;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            font-size: 9px;
            border-top: 1px solid #ddd;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>

    <div class="pdf-toolbar">
        <div class="pdf-title-container">
            <button class="pdf-hamburger" onclick="toggleSidebar()" title="Toggle Sidebar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <div class="pdf-title">Pratinjau Rapor - ${student.nama || "Siswa"}</div>
        </div>
        <div class="pdf-controls">
            <div class="pdf-page-indicator">
                <input type="text" id="current-page-num" class="pdf-page-input" value="1" onchange="goToPage(this.value)">
                <span>/</span>
                <span id="total-pages-num">5</span>
            </div>
            <div style="border-left: 1px solid #555; height: 18px; margin: 0 4px;"></div>
            <button class="pdf-control-btn" onclick="changeZoom(-0.1)" title="Zoom Out">−</button>
            <span class="pdf-zoom-text" id="zoom-val">100%</span>
            <button class="pdf-control-btn" onclick="changeZoom(0.1)" title="Zoom In">+</button>
        </div>
        <div class="pdf-actions">
            <button class="pdf-btn" onclick="window.print()" title="Cetak Rapor">
                <svg viewBox="0 0 24 24">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="pdf-content-wrapper">
        <div class="pdf-sidebar">
            ${thumbnailsHtml}
        </div>
        <div class="pdf-main-pane">
            ${pagesHtml}
        </div>
    </div>

    <script>
        let currentZoom = 1.0;
        
        function changeZoom(delta) {
            currentZoom = Math.min(2.0, Math.max(0.5, currentZoom + delta));
            const pane = document.querySelector('.pdf-main-pane');
            if (pane) {
                pane.style.setProperty('--pdf-zoom', currentZoom);
            }
            const zoomVal = document.getElementById('zoom-val');
            if (zoomVal) {
                zoomVal.innerText = Math.round(currentZoom * 100) + '%';
            }
        }
        
        function toggleSidebar() {
            const sidebar = document.querySelector('.pdf-sidebar');
            if (sidebar) {
                if (sidebar.style.display === 'none') {
                    sidebar.style.display = 'flex';
                } else {
                    sidebar.style.display = 'none';
                }
            }
        }
        
        function goToPage(pageNum) {
            pageNum = parseInt(pageNum);
            const total = parseInt(document.getElementById('total-pages-num').innerText);
            if (pageNum >= 1 && pageNum <= total) {
                const target = document.getElementById('page-container-' + pageNum);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        window.addEventListener('load', () => {
            const pane = document.querySelector('.pdf-main-pane');
            const containers = document.querySelectorAll('.pdf-main-pane .page-container');
            const thumbs = document.querySelectorAll('.thumbnail-container');
            
            const updateActiveThumb = () => {
                if (!pane) return;
                let activeIndex = 0;
                let minDiff = Infinity;
                const paneTop = pane.getBoundingClientRect().top;
                
                containers.forEach((el, idx) => {
                    const rect = el.getBoundingClientRect();
                    const diff = Math.abs(rect.top - paneTop);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIndex = idx;
                    }
                });
                
                thumbs.forEach((th, idx) => {
                    if (idx === activeIndex) {
                        th.classList.add('active');
                        th.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        th.classList.remove('active');
                    }
                });
                
                const pageNumEl = document.getElementById('current-page-num');
                if (pageNumEl) {
                    pageNumEl.value = activeIndex + 1;
                }
            };
            
            if (pane) {
                pane.addEventListener('scroll', updateActiveThumb);
                updateActiveThumb();
            }
            
            // Set up page input listener
            const pageInput = document.getElementById('current-page-num');
            if (pageInput) {
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        goToPage(e.target.value);
                    }
                });
            }
        });
    </script>
</body>
</html>
      `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

  } catch (error) {
    Swal.close();
    Swal.fire("Error", "Gagal memuat data rapor untuk dicetak", "error");
    console.error(error);
  }
};
