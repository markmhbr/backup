import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import SchoolProfile from "./pages/DataMaster/SchoolProfile";
import GTKData from "./pages/DataMaster/GTKData";
import StudentData from "./pages/DataMaster/StudentData";
import EditStudentPage from "./pages/DataMaster/EditStudentPage";
import EditGTKPage from "./pages/DataMaster/EditGTKPage";
import GTKPerbaikan from "./pages/DataMaster/GTKPerbaikan";
import StudentPerbaikan from "./pages/DataMaster/StudentPerbaikan";
import ClassData from "./pages/DataMaster/ClassData";
import ClassDetail from "./pages/DataMaster/ClassDetail";
import SubjectData from "./pages/DataMaster/SubjectData";
import SarprasData from "./pages/DataMaster/SarprasData";
import GTKBukuInduk from "./pages/DataMaster/GTKBukuInduk";
import StudentBukuInduk from "./pages/DataMaster/StudentBukuInduk";
import TugasGTKPage from "./pages/DataMaster/TugasGTKPage";
import TugasPDPage from "./pages/DataMaster/TugasPDPage";
import TahunPelajaran from "./pages/Academic/TahunPelajaran";
import KompetensiPage from "./pages/Academic/KompetensiPage";
import GTKCardPage from "./pages/Academic/GTKCardPage";
import PDCardPage from "./pages/DataMaster/PDCardPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { getRoleSlug } from "./services/roleUtils";
import PengaturanJam from "./pages/Kurikulum/PengaturanJam";
import JadwalPelajaran from "./pages/Kurikulum/JadwalPelajaran";
import PresensiPD from "./pages/Kurikulum/Presensi/PresensiPD";
import PresensiGTK from "./pages/Kurikulum/Presensi/PresensiGTK";
import HariLibur from "./pages/Kurikulum/Presensi/HariLibur";
import Scanner from "./pages/Kurikulum/Presensi/Scanner";
import IzinSakit from "./pages/Kurikulum/Presensi/IzinSakit";
import IndisiplinerData from "./pages/indisipliner/IndisiplinerData";
import KeuanganData from "./pages/keuangan/KeuanganData";
import SuratData from "./pages/Surat/SuratData";
import LayananMandala from "./pages/Layanan/LayananMandala";
import PelaporanSekolahPage from "./pages/Pelaporan/index";
import DetailPelaporanSekolahPage from "./pages/Pelaporan/detail";
import MenuSettings from "./pages/Pengaturan/Menu";
import BackupPage from "./pages/Pengaturan/Backup";
import Umum from "./pages/Pengaturan/Umum";
import ProfilePage from "./pages/DataMaster/ProfilePage";

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={`/${getRoleSlug(user.role)}`} replace />;
  }
  return <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root to role-based dashboard */}
          <Route path="/" element={<HomeRedirect />} />
          
          <Route path="/:role">
            <Route index element={<Home />} />

            {/* Data Master */}
            <Route path="school-profile" element={<SchoolProfile />} />
            <Route path="gtk-data" element={<GTKData />} />
            <Route path="gtk-data/edit/:id" element={<EditGTKPage />} />
            <Route path="gtk-perbaikan" element={<GTKPerbaikan />} />
            <Route path="student-data" element={<StudentData />} />
            <Route path="student-data/edit/:id" element={<EditStudentPage />} />
            <Route path="student-perbaikan" element={<StudentPerbaikan />} />
            <Route path="class-data" element={<ClassData />} />
            <Route path="class-data/detail/:id" element={<ClassDetail />} />
            <Route path="subject-data" element={<SubjectData />} />
            <Route path="sarpras-data" element={<SarprasData />} />
            <Route path="gtk-buku-induk" element={<GTKBukuInduk />} />
            <Route path="student-buku-induk" element={<StudentBukuInduk />} />
            <Route path="gtk-tugas" element={<TugasGTKPage />} />
            <Route path="student-tugas" element={<TugasPDPage />} />

            {/* Academic */}
            <Route path="academic/year" element={<TahunPelajaran />} />
            <Route path="academic/competency" element={<KompetensiPage />} />
            <Route path="gtk-card" element={<GTKCardPage />} />
            <Route path="student-card" element={<PDCardPage />} />

            {/* Kurikulum */}
            <Route path="kurikulum/pengaturan-jam" element={<PengaturanJam />} />
            <Route path="kurikulum/jadwal-pelajaran" element={<JadwalPelajaran />} />
            <Route path="kurikulum/presensi/scanner" element={<Scanner />} />
            <Route path="kurikulum/presensi/pesertadidik" element={<PresensiPD />} />
            <Route path="kurikulum/presensi/gtk" element={<PresensiGTK />} />
            <Route path="kurikulum/presensi/mapel" element={<Blank />} />
            <Route path="kurikulum/presensi/izin" element={<IzinSakit />} />
            <Route path="kurikulum/presensi/hari-libur" element={<HariLibur />} />

            {/* Indisipliner */}
            <Route path="indisipliner" element={<IndisiplinerData />} />

            {/* Keuangan */}
            <Route path="keuangan" element={<KeuanganData />} />

            {/* Administrasi Surat */}
            <Route path="surat" element={<SuratData />} />

            {/* Layanan Mandala */}
            <Route path="layanan" element={<LayananMandala />} />
            <Route path="pelaporan" element={<PelaporanSekolahPage />} />
            <Route path="pelaporan/detail" element={<DetailPelaporanSekolahPage />} />

            {/* Pengaturan */}
            <Route path="pengaturan/menu" element={<MenuSettings />} />
            <Route path="pengaturan/backup" element={<BackupPage />} />
            <Route path="pengaturan/umum" element={<Umum />} />

            {/* Other */}
            
            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Auth Pages */}
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/blank" element={<Blank />} />

        {/* Forms */}
        <Route path="/form-elements" element={<FormElements />} />

        {/* Tables */}
        <Route path="/basic-tables" element={<BasicTables />} />

        {/* Ui Elements */}
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/images" element={<Images />} />
        <Route path="/videos" element={<Videos />} />

        {/* Charts */}
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/bar-chart" element={<BarChart />} />

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
