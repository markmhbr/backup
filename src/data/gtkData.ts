export interface GTK {
  id: number;
  induk: "Ya" | "Tidak";
  nama: string;
  avatar: string;
  jk: "L" | "P";
  lengkapData: number;
  tempatLahir: string;
  tanggalLahir: string;
  ibuKandung: string;
  statusKepegawaian: string;
  jenisGTK: string;
  jabatanGTK: string;
  alamat: string;
  nuptk: string;
  tglSuratTugas: string;
  // Additional fields for the modal
  rtRw?: string;
  kodePos?: string;
  kecamatan?: string;
  kotaKabupaten?: string;
  pangkatGolongan?: string;
  tmtPengangkatan?: string;
  pendidikanTerakhir?: string;
  programStudi?: string;
  perguruanTinggi?: string;
  noHp?: string;
  email?: string;
  noSerdik?: string;
  bidangStudiSerdik?: string;
  alasan?: string; // for non-aktif
  tglKeluar?: string; // for non-aktif
}

export const allGTKData: GTK[] = [
  // GURU
  { 
    id: 1, 
    induk: "Ya", 
    nama: "Abdul Gani, S.Ag.", 
    avatar: "/images/user/user-01.jpg", 
    jk: "L", 
    lengkapData: 75, 
    tempatLahir: "Bandung", 
    tanggalLahir: "1970-05-01", 
    ibuKandung: "Aminah", 
    statusKepegawaian: "PNS", 
    jenisGTK: "Guru Mapel", 
    jabatanGTK: "Guru Madya", 
    alamat: "Jl. Pajajaran No. 2", 
    rtRw: "04/05",
    kodePos: "40123",
    kecamatan: "Cicendo",
    kotaKabupaten: "Bandung",
    nuptk: "7890123456789012", 
    tglSuratTugas: "1998-03-01",
    pangkatGolongan: "IV/a",
    tmtPengangkatan: "1998-03-01",
    pendidikanTerakhir: "S1",
    programStudi: "Pendidikan Agama Islam",
    perguruanTinggi: "UIN Sunan Gunung Djati",
    noHp: "081234567890",
    email: "abdulgani@email.com",
    noSerdik: "SER-12345",
    bidangStudiSerdik: "Pendidikan Agama Islam"
  },
  { id: 2, induk: "Ya", nama: "Ani Maryani, S.Pd.", avatar: "/images/user/user-02.jpg", jk: "P", lengkapData: 100, tempatLahir: "Tasikmalaya", tanggalLahir: "1992-06-05", ibuKandung: "Suryati", statusKepegawaian: "Honorer", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Seni", alamat: "Jl. Cipedes No. 22, Tasikmalaya", nuptk: "-", tglSuratTugas: "2020-07-01" },
  { id: 3, induk: "Tidak", nama: "Bambang Herlambang, S.T.", avatar: "/images/user/user-03.jpg", jk: "L", lengkapData: 45, tempatLahir: "Jakarta", tanggalLahir: "1988-08-20", ibuKandung: "Kartini", statusKepegawaian: "Honorer", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Pertama", alamat: "Jl. Sukajadi No. 45, Bandung", nuptk: "-", tglSuratTugas: "2018-07-15" },
  { id: 4, induk: "Ya", nama: "Budi Cahyadi, M.Pd.", avatar: "/images/user/user-04.jpg", jk: "L", lengkapData: 90, tempatLahir: "Bandung", tanggalLahir: "1980-10-10", ibuKandung: "Rahmah", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Muda", alamat: "Jl. Asia Afrika No. 10, Bandung", nuptk: "5678901234567890", tglSuratTugas: "2012-01-01" },
  { id: 5, induk: "Ya", nama: "Dadan Ramdan, M.T.", avatar: "/images/user/user-05.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "1978-08-25", ibuKandung: "Rohayah", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Pasir Kaliki No. 100, Bandung", nuptk: "8901234567890123", tglSuratTugas: "2004-01-01" },
  { id: 6, induk: "Ya", nama: "Dewi Sartika, S.Pd.", avatar: "/images/user/user-06.jpg", jk: "P", lengkapData: 100, tempatLahir: "Garut", tanggalLahir: "1990-03-15", ibuKandung: "Lilis", statusKepegawaian: "PPPK", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Pertama", alamat: "Jl. Cimanuk No. 100, Garut", nuptk: "3456789012345678", tglSuratTugas: "2019-03-01" },
  { id: 7, induk: "Ya", nama: "Eko Prasetyo, M.Kom.", avatar: "/images/user/user-07.jpg", jk: "L", lengkapData: 60, tempatLahir: "Surabaya", tanggalLahir: "1985-11-10", ibuKandung: "Maryani", statusKepegawaian: "Honorer", jenisGTK: "Guru Mapel", jabatanGTK: "Guru TIK", alamat: "Jl. Antapani No. 5, Bandung", nuptk: "-", tglSuratTugas: "2015-09-01" },
  { id: 8, induk: "Ya", nama: "Endang Suherman", avatar: "/images/user/user-08.jpg", jk: "L", lengkapData: 55, tempatLahir: "Sukabumi", tanggalLahir: "1982-10-10", ibuKandung: "Siti", statusKepegawaian: "Honorer", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Otomotif", alamat: "Jl. Cibadak No. 4, Sukabumi", nuptk: "-", tglSuratTugas: "2011-07-01" },
  { id: 9, induk: "Ya", nama: "Farida Utami, S.Pd.", avatar: "/images/user/user-09.jpg", jk: "P", lengkapData: 100, tempatLahir: "Bogor", tanggalLahir: "1987-01-05", ibuKandung: "Uti", statusKepegawaian: "PPPK", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Pertama", alamat: "Jl. Pajajaran No. 8, Bogor", nuptk: "9012345678901234", tglSuratTugas: "2020-03-01" },
  { id: 10, induk: "Tidak", nama: "Ginanjar Saputra", avatar: "/images/user/user-10.jpg", jk: "L", lengkapData: 35, tempatLahir: "Bandung", tanggalLahir: "1995-02-18", ibuKandung: "Kokom", statusKepegawaian: "Honorer", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Agama", alamat: "Jl. Kopo No. 45, Bandung", nuptk: "-", tglSuratTugas: "2019-01-01" },

  // TENDIK
  { id: 101, induk: "Tidak", nama: "Ahmad Suherman", avatar: "/images/user/user-10.jpg", jk: "L", lengkapData: 45, tempatLahir: "Bandung", tanggalLahir: "1982-06-05", ibuKandung: "Aminah", statusKepegawaian: "Honorer", jenisGTK: "Teknisi", jabatanGTK: "Maintenance", alamat: "Jl. Antapani No. 3, Bandung", nuptk: "-", tglSuratTugas: "2015-07-01" },
  { id: 102, induk: "Tidak", nama: "Agus Setiawan", avatar: "/images/user/user-11.jpg", jk: "L", lengkapData: 35, tempatLahir: "Cimahi", tanggalLahir: "1990-02-14", ibuKandung: "Aminah", statusKepegawaian: "Honorer", jenisGTK: "Laboran", jabatanGTK: "Laboran", alamat: "Jl. Cimahi No. 44, Cimahi", nuptk: "-", tglSuratTugas: "2015-01-01" },
  { id: 103, induk: "Ya", nama: "Bambang Sugiharto", avatar: "/images/user/user-12.jpg", jk: "L", lengkapData: 60, tempatLahir: "Jakarta", tanggalLahir: "1977-08-15", ibuKandung: "Siti", statusKepegawaian: "PNS", jenisGTK: "Kepala Sekolah", jabatanGTK: "Pembina", alamat: "Jl. Jakarta No. 1, Bandung", nuptk: "1234567890987654", tglSuratTugas: "2003-01-01" },

  // NON AKTIF
  { id: 201, induk: "Ya", nama: "Budi Santoso, S.Pd.", avatar: "/images/user/user-01.jpg", jk: "L", lengkapData: 100, tempatLahir: "Cimahi", tanggalLahir: "1964-11-05", ibuKandung: "Siti", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Cimahi Indah No. 1, Cimahi", nuptk: "3333444455556666", tglSuratTugas: "1988-03-01", alasan: "Pensiun", tglKeluar: "2023-12-31" },
];
