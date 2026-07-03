import React, { useEffect, useState, useRef } from 'react';
import { formatDateDMY } from '../../utils/formatDate';
import { useSearchParams } from 'react-router';
import { suratService } from '../../services/suratService';
import { dapodikService } from '../../services/dapodikService';
import Swal from 'sweetalert2';
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { PrinterIcon, SearchIcon, PencilIcon, TrashBinIcon, CheckCircleIcon, PlusIcon } from "../../icons";

const SuratData: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pengaturan';

  const [loading, setLoading] = useState(false);

  // Dropdown list states
  const [rombels, setRombels] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [gtks, setGtks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [numberConfigs, setNumberConfigs] = useState<any[]>([]);

  // Selected values for forms
  const [selectedRombel, setSelectedRombel] = useState('');

  // 1. Tab States
  const [pengaturans, setPengaturans] = useState<any[]>([]);
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [outbounds, setOutbounds] = useState<any[]>([]);
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [subTab, setSubTab] = useState<'peserta_didik' | 'gtk'>('peserta_didik');
  const [templateSubTab, setTemplateSubTab] = useState<'peserta_didik' | 'gtk'>('peserta_didik');

  // Editor states
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'pengaturan' | 'template' | 'masuk' | 'keluar'>('pengaturan');
  const [editId, setEditId] = useState<string | null>(null);
  const [previewSurat, setPreviewSurat] = useState<any | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<any>({
    // Pengaturan Nomor
    kategori: 0,
    nama_label: '',
    format_nomor: '',
    counter: 0,
    aktif: true,
    // Template Surat
    nama_template: '',
    ukuran_kertas: 1,
    margin_atas: 20,
    margin_bawah: 20,
    margin_kiri: 20,
    margin_kanan: 20,
    konten_html: '',
    // Surat Masuk
    tanggal_surat: '',
    tanggal_diterima: '',
    nomor_agenda: '',
    nomor_surat: '',
    asal_surat: '',
    tujuan_disposisi: '',
    perihal: '',
    keterangan: '',
    file_url: '',
    // Surat Keluar
    template_surat_id: '',
    pengaturan_nomor_surat_id: '',
    peserta_didik_id: '',
    ptk_id: '',
  });



  // Load TinyMCE dynamically
  useEffect(() => {
    if (currentTab !== 'template') return;

    if (!(window as any).tinymce) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = () => {
        setEditorLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setEditorLoaded(true);
    }
  }, [currentTab]);

  // Initialize/Remove TinyMCE Editor instance
  useEffect(() => {
    let active = true;
    if (currentTab === 'template' && editorLoaded && !loading) {
      const initTinyMCE = () => {
        if ((window as any).tinymce) {
          (window as any).tinymce.remove('#template-editor-textarea');
          (window as any).tinymce.init({
            selector: '#template-editor-textarea',
            height: 600,
            menubar: 'file edit view insert format tools table help',
            plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
            toolbar: 'undo redo | blocks | fontfamily fontsize | bold italic underline | alignleft aligncenter alignright alignjustify | forecolor backcolor | removeformat | help',
            font_family_formats: 'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva',
            branding: false,
            promotion: false,
            content_style: `
              html {
                background-color: #374151;
                padding: 20px;
                display: flex;
                justify-content: center;
                box-sizing: border-box;
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.5;
                padding: 20mm;
                width: 210mm;
                min-height: 297mm;
                background-color: #fff;
                color: #000;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                box-sizing: border-box;
                margin: 0 auto;
                border: 1px solid #1f2937;
              }
            `,
            setup: (editor: any) => {
              editorRef.current = editor;
              editor.on('change keyup undo redo', () => {
                setFormData((prev: any) => ({
                  ...prev,
                  konten_html: editor.getContent()
                }));
              });
              editor.on('init', () => {
                editor.setContent(formData.konten_html || '');
              });
            }
          });
        }
      };

      const timer = setTimeout(() => {
        if (active) initTinyMCE();
      }, 50);

      return () => {
        active = false;
        clearTimeout(timer);
        if ((window as any).tinymce) {
          (window as any).tinymce.remove('#template-editor-textarea');
        }
      };
    }
  }, [currentTab, editorLoaded, loading]);

  // Synchronize component state to editor content on external changes (e.g. loading edit template)
  useEffect(() => {
    if (editorRef.current && currentTab === 'template') {
      const currentContent = editorRef.current.getContent();
      if (currentContent !== formData.konten_html) {
        editorRef.current.setContent(formData.konten_html || '');
      }
    }
  }, [formData.konten_html, currentTab]);

  // Synchronize margins and paper size to editor body layout
  useEffect(() => {
    if (editorRef.current && currentTab === 'template') {
      const body = editorRef.current.getBody();
      if (body) {
        body.style.paddingTop = `${formData.margin_atas || 20}mm`;
        body.style.paddingBottom = `${formData.margin_bawah || 20}mm`;
        body.style.paddingLeft = `${formData.margin_kiri || 20}mm`;
        body.style.paddingRight = `${formData.margin_kanan || 20}mm`;

        // Adjust sheet width & min-height based on selected paper size:
        // 1 = A4 (210x297mm), 2 = F4 (215x330mm), 3 = Letter (215.9x279.4mm), 4 = Legal (215.9x355.6mm)
        const paperType = Number(formData.ukuran_kertas);
        if (paperType === 2) {
          body.style.width = '215mm';
          body.style.minHeight = '330mm';
        } else if (paperType === 3) {
          body.style.width = '215.9mm';
          body.style.minHeight = '279.4mm';
        } else if (paperType === 4) {
          body.style.width = '215.9mm';
          body.style.minHeight = '355.6mm';
        } else {
          // Default: A4 (1)
          body.style.width = '210mm';
          body.style.minHeight = '297mm';
        }
      }
    }
  }, [formData.margin_atas, formData.margin_bawah, formData.margin_kiri, formData.margin_kanan, formData.ukuran_kertas, currentTab, editorLoaded]);

  // Fetch initial data based on tab
  useEffect(() => {
    fetchData();
    // Pre-load reference lists for letter generation
    if (currentTab === 'keluar') {
      loadDropdowns();
    }
  }, [currentTab, currentPage, searchQuery, subTab, itemsPerPage]);

  // Load dropdown lists for Select options in forms
  const loadDropdowns = async () => {
    try {
      const rombelRes = await dapodikService.getRombonganBelajar('reguler', 100);
      setRombels(rombelRes.data || []);

      const gtkRes = await dapodikService.getGTK(100, '', 1);
      setGtks(gtkRes.data || []);

      const templateRes = await suratService.getTemplates();
      setTemplates(templateRes.data || []);

      const numConfigRes = await suratService.getPengaturanNomor();
      setNumberConfigs(numConfigRes.data || []);
    } catch (err) {
      console.error('Failed to load form lookup data:', err);
    }
  };

  // Fetch student items dynamically when rombel (class) changes
  useEffect(() => {
    if (selectedRombel) {
      dapodikService.getPesertaDidik(100, '', 1, selectedRombel).then((res) => {
        setStudents(res.data || []);
      });
    } else {
      setStudents([]);
    }
  }, [selectedRombel]);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      Swal.fire({
        title: "Berhasil!",
        text: msg,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        title: "Gagal!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#465fff",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (currentTab === 'pengaturan') {
        const res = await suratService.getPengaturanNomor();
        setPengaturans(res.data || []);
      } else if (currentTab === 'template') {
        const res = await suratService.getTemplates();
        setTemplateList(res.data || []);
      } else if (currentTab === 'masuk') {
        const res = await suratService.getSuratMasuk({
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage,
        });
        setInbounds(res.data || []);
        setTotalPages(res.meta?.total_pages || 1);
      } else if (currentTab === 'keluar' || currentTab === 'arsip') {
        const statusFilter = currentTab === 'arsip' ? undefined : 1; // Draft
        const res = await suratService.getSuratKeluar({
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter,
          sub: subTab,
        });
        setOutbounds(res.data || []);
        setTotalPages(res.meta?.total_pages || 1);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal memuat data.', 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      kategori: 0,
      nama_label: '',
      format_nomor: '{NO}/SMKN1/{LABEL}/{ROMAWI}/{TAHUN}',
      counter: 0,
      aktif: true,
      nama_template: '',
      ukuran_kertas: 1,
      margin_atas: 20,
      margin_bawah: 20,
      margin_kiri: 20,
      margin_kanan: 20,
      konten_html: '',
      tanggal_surat: new Date().toISOString().split('T')[0],
      tanggal_diterima: new Date().toISOString().split('T')[0],
      nomor_agenda: '',
      nomor_surat: '',
      asal_surat: '',
      tujuan_disposisi: '',
      perihal: '',
      keterangan: '',
      file_url: '',
      template_surat_id: '',
      pengaturan_nomor_surat_id: '',
      peserta_didik_id: '',
      ptk_id: '',
    });
    setSelectedRombel('');
    setModalType(
      currentTab === 'pengaturan' ? 'pengaturan' : 
      currentTab === 'template' ? 'template' : 
      currentTab === 'masuk' ? 'masuk' : 'keluar'
    );
    setShowModal(true);
  };

  const handleOpenEdit = async (item: any) => {
    setEditId(
      currentTab === 'pengaturan' ? item.pengaturan_nomor_surat_id :
      currentTab === 'template' ? item.template_surat_id :
      currentTab === 'masuk' ? item.surat_masuk_id : item.surat_keluar_id
    );

    setFormData({
      kategori: item.kategori,
      nama_label: item.nama_label || '',
      format_nomor: item.format_nomor || '',
      counter: item.counter || 0,
      aktif: item.aktif !== undefined ? item.aktif : true,
      nama_template: item.nama_template || '',
      ukuran_kertas: item.ukuran_kertas || 1,
      margin_atas: item.margin_atas || 20,
      margin_bawah: item.margin_bawah || 20,
      margin_kiri: item.margin_kiri || 20,
      margin_kanan: item.margin_kanan || 20,
      konten_html: item.konten_html || '',
      tanggal_surat: item.tanggal_surat ? new Date(item.tanggal_surat).toISOString().split('T')[0] : '',
      tanggal_diterima: item.tanggal_diterima ? new Date(item.tanggal_diterima).toISOString().split('T')[0] : '',
      nomor_agenda: item.nomor_agenda || '',
      nomor_surat: item.nomor_surat || '',
      asal_surat: item.asal_surat || '',
      tujuan_disposisi: item.tujuan_disposisi || '',
      perihal: item.perihal || '',
      keterangan: item.keterangan || '',
      file_url: item.file_url || '',
      template_surat_id: item.template_surat_id || '',
      pengaturan_nomor_surat_id: item.pengaturan_nomor_surat_id || '',
      peserta_didik_id: item.peserta_didik_id || '',
      ptk_id: item.ptk_id || '',
    });

    if (item.peserta_didik_id) {
      try {
        const studentRes = await dapodikService.getPesertaDidikDetail(item.peserta_didik_id);
        if (studentRes && studentRes.data) {
          setSelectedRombel(studentRes.data.nama_rombel || '');
        }
      } catch (err) {
        console.error('Failed to load student details for editing:', err);
      }
    } else {
      setSelectedRombel('');
    }

    setModalType(
      currentTab === 'pengaturan' ? 'pengaturan' : 
      currentTab === 'template' ? 'template' : 
      currentTab === 'masuk' ? 'masuk' : 'keluar'
    );
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalType === 'pengaturan') {
        if (editId) {
          await suratService.updatePengaturanNomor(editId, formData);
          showNotification('Pengaturan nomor surat diperbarui.', 'success');
        } else {
          await suratService.createPengaturanNomor(formData);
          showNotification('Pengaturan nomor surat ditambahkan.', 'success');
        }
      } else if (modalType === 'template') {
        if (editId) {
          await suratService.updateTemplate(editId, formData);
          showNotification('Template surat diperbarui.', 'success');
        } else {
          await suratService.createTemplate(formData);
          showNotification('Template surat ditambahkan.', 'success');
        }
      } else if (modalType === 'masuk') {
        if (editId) {
          await suratService.updateSuratMasuk(editId, formData);
          showNotification('Data surat masuk diperbarui.', 'success');
        } else {
          await suratService.createSuratMasuk(formData);
          showNotification('Data surat masuk dicatat.', 'success');
        }
      } else if (modalType === 'keluar') {
        if (editId) {
          await suratService.updateSuratKeluar(editId, formData);
          showNotification('Draft surat keluar diperbarui.', 'success');
        } else {
          await suratService.createSuratKeluar(formData);
          showNotification('Draft surat keluar dibuat.', 'success');
        }
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Swal.fire({
      title: "Hapus Data?",
      text: "Apakah Anda yakin ingin menghapus data ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          if (currentTab === 'pengaturan') {
            await suratService.deletePengaturanNomor(id);
          } else if (currentTab === 'template') {
            await suratService.deleteTemplate(id);
          } else if (currentTab === 'masuk') {
            await suratService.deleteSuratMasuk(id);
          } else if (currentTab === 'keluar') {
            await suratService.deleteSuratKeluar(id);
          }
          Swal.fire({
            title: "Berhasil!",
            text: "Data berhasil dihapus.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchData();
        } catch (err: any) {
          showNotification(err.response?.data?.message || 'Gagal menghapus data.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePublish = async (id: string) => {
    Swal.fire({
      title: "Terbitkan Surat Resmi?",
      text: "Terbitkan nomor resmi untuk surat ini? Setelah diterbitkan nomor surat tidak dapat diubah.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Terbitkan!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await suratService.terbitkanSurat(id);
          Swal.fire({
            title: "Berhasil!",
            text: "Surat resmi berhasil diterbitkan.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchData();
        } catch (err: any) {
          showNotification(err.response?.data?.message || 'Gagal menerbitkan surat.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleResetTemplateForm = (kategori: number) => {
    setEditId(null);
    setFormData((prev: any) => ({
      ...prev,
      nama_template: '',
      ukuran_kertas: 1,
      margin_atas: 20,
      margin_bawah: 20,
      margin_kiri: 20,
      margin_kanan: 20,
      konten_html: '',
      kategori: kategori,
      pengaturan_nomor_surat_id: '',
    }));
    if (editorRef.current) {
      editorRef.current.setContent('');
    }
  };

  const handleLoadTemplateForEdit = (template: any) => {
    setEditId(template.template_surat_id);
    setFormData((prev: any) => ({
      ...prev,
      nama_template: template.nama_template,
      ukuran_kertas: template.ukuran_kertas,
      margin_atas: template.margin_atas,
      margin_bawah: template.margin_bawah,
      margin_kiri: template.margin_kiri,
      margin_kanan: template.margin_kanan,
      konten_html: template.konten_html,
      kategori: template.kategori,
      pengaturan_nomor_surat_id: template.pengaturan_nomor_surat_id || '',
    }));
    if (editorRef.current) {
      editorRef.current.setContent(template.konten_html || '');
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.nama_template) {
      Swal.fire('Peringatan', 'Judul template surat wajib diisi.', 'warning');
      return;
    }
    
    const content = editorRef.current ? editorRef.current.getContent() : formData.konten_html;

    const data = {
      nama_template: formData.nama_template,
      kategori: templateSubTab === 'peserta_didik' ? 0 : 1,
      ukuran_kertas: Number(formData.ukuran_kertas),
      margin_atas: Number(formData.margin_atas),
      margin_bawah: Number(formData.margin_bawah),
      margin_kiri: Number(formData.margin_kiri),
      margin_kanan: Number(formData.margin_kanan),
      konten_html: content,
      pengaturan_nomor_surat_id: formData.pengaturan_nomor_surat_id,
    };

    setLoading(true);
    try {
      if (editId) {
        await suratService.updateTemplate(editId, data);
        Swal.fire({
          title: "Berhasil!",
          text: "Template surat berhasil diperbarui.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await suratService.createTemplate(data);
        Swal.fire({
          title: "Berhasil!",
          text: "Template surat baru berhasil disimpan.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setEditId(null);
      handleResetTemplateForm(templateSubTab === 'peserta_didik' ? 0 : 1);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        title: "Gagal!",
        text: err.response?.data?.message || "Gagal menyimpan template.",
        icon: "error",
        confirmButtonColor: "#465fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplateItem = async (id: string) => {
    Swal.fire({
      title: "Hapus Template?",
      text: "Apakah Anda yakin ingin menghapus template surat ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await suratService.deleteTemplate(id);
          Swal.fire({
            title: "Berhasil!",
            text: "Template berhasil dihapus.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          if (editId === id) {
            handleResetTemplateForm(templateSubTab === 'peserta_didik' ? 0 : 1);
          }
          fetchData();
        } catch (err: any) {
          Swal.fire({
            title: "Gagal!",
            text: err.response?.data?.message || "Gagal menghapus template.",
            icon: "error",
            confirmButtonColor: "#465fff",
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const insertQuickVariable = (placeholder: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand('mceInsertContent', false, placeholder);
      setFormData((prev: any) => ({
        ...prev,
        konten_html: editorRef.current.getContent()
      }));
    }
  };

  useEffect(() => {
    (window as any).handleInsertTemplateVariable = (placeholder: string) => {
      insertQuickVariable(placeholder);
    };
    return () => {
      delete (window as any).handleInsertTemplateVariable;
    };
  }, []);

  const handlePreview = async (id: string) => {
    setLoading(true);
    try {
      const res = await suratService.getPreviewSurat(id);
      setPreviewSurat(res.data);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal memuat preview.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('print-preview-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
  };

  const getKategoriName = (cat: number) => {
    if (cat === 0) return 'Peserta Didik';
    if (cat === 1) return 'GTK';
    return 'SK Sekolah';
  };

  const getKertasName = (sz: number) => {
    const names = ['A4', 'F4', 'Letter', 'Legal'];
    return names[sz - 1] || 'Kertas Custom';
  };
  const filteredTemplates = templateList.filter((t: any) => {
    const targetCategory = templateSubTab === 'peserta_didik' ? 0 : 1;
    return t.kategori === targetCategory;
  });

  return (
    <>
      <PageMeta
        title="Administrasi Surat | SIMAK Admin Panel"
        description="Manajemen surat masuk, keluar, dan template surat."
      />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {currentTab === 'template' ? 'Template Surat' : 
               currentTab === 'masuk' ? 'Surat Masuk' : 
               currentTab === 'keluar' ? 'Surat Keluar (Draft)' : 
               currentTab === 'pengaturan' ? 'Pengaturan Nomor' : 'Arsip Surat'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {currentTab === 'template' ? 'Kelola template format surat dinas untuk peserta didik dan GTK.' :
               currentTab === 'masuk' ? 'Pencatatan dan manajemen dokumen surat masuk sekolah.' :
               currentTab === 'pengaturan' ? 'Kelola master penomoran surat otomatis.' :
               'Manajemen pembuatan, penomoran, dan pengarsipan surat keluar.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currentTab !== 'arsip' && (
              <Button
                variant="outline"
                size="sm"
                startIcon={<PlusIcon className="size-4 fill-current" />}
                onClick={handleOpenAdd}
              >
                {currentTab === 'template' ? 'Buat Template' : 'Tambah Data'}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          
          {/* Sub-Tabs Navigation */}
          {['keluar', 'arsip', 'template'].includes(currentTab) && (
            <div className="flex border-b border-gray-100 dark:border-white/[0.05] gap-1 mb-6 overflow-x-auto no-scrollbar">
              {[
                { id: 'peserta_didik', label: 'Peserta Didik' },
                { id: 'gtk', label: 'GTK' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (currentTab === 'template') {
                      setTemplateSubTab(tab.id as any);
                      handleResetTemplateForm(tab.id === 'peserta_didik' ? 0 : 1);
                    } else {
                      setSubTab(tab.id as any);
                      setCurrentPage(1);
                    }
                  }}
                  className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    (currentTab === 'template' ? templateSubTab : subTab) === tab.id
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Table Controls (Search & Rows Per Page) */}
          {currentTab !== 'template' && (
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
              <div className="w-20">
                <Select
                  options={[
                    { value: "10", label: "10" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                  defaultValue={itemsPerPage.toString()}
                  onChange={(value) => setItemsPerPage(parseInt(value))}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="size-5" />
                  </span>
                  <Input
                    type="text"
                    placeholder={`Cari ${currentTab === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

      {/* Main Content Loading */}
      {loading && !showModal && !previewSurat ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <>
          {currentTab === 'template' ? (
            <div className="space-y-6">
              {/* Two Column Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Form & TinyMCE Editor */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-600 dark:text-brand-400">
                      {editId ? 'Edit Template' : 'Buat Baru'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Judul Surat</label>
                      <input
                        type="text"
                        placeholder="Contoh: Surat Keterangan Lulus"
                        value={formData.nama_template}
                        onChange={(e) => setFormData({ ...formData, nama_template: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ukuran Kertas</label>
                      <select
                        value={formData.ukuran_kertas}
                        onChange={(e) => setFormData({ ...formData, ukuran_kertas: Number(e.target.value) })}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                      >
                        <option value="1">A4</option>
                        <option value="2">F4</option>
                        <option value="3">Letter</option>
                        <option value="4">Legal</option>
                      </select>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                      Margin (MM)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Atas */}
                      <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden text-sm shadow-sm bg-white dark:bg-gray-900">
                        <span className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-550 border-r border-gray-300 dark:border-gray-700 select-none flex items-center justify-center min-w-[60px]">Atas</span>
                        <input
                          type="number"
                          value={formData.margin_atas}
                          onChange={(e) => setFormData({ ...formData, margin_atas: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white text-center"
                        />
                      </div>
                      {/* Kanan */}
                      <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden text-sm shadow-sm bg-white dark:bg-gray-900">
                        <span className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-550 border-r border-gray-300 dark:border-gray-700 select-none flex items-center justify-center min-w-[60px]">Kanan</span>
                        <input
                          type="number"
                          value={formData.margin_kanan}
                          onChange={(e) => setFormData({ ...formData, margin_kanan: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white text-center"
                        />
                      </div>
                      {/* Bawah */}
                      <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden text-sm shadow-sm bg-white dark:bg-gray-900">
                        <span className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-550 border-r border-gray-300 dark:border-gray-700 select-none flex items-center justify-center min-w-[60px]">Bawah</span>
                        <input
                          type="number"
                          value={formData.margin_bawah}
                          onChange={(e) => setFormData({ ...formData, margin_bawah: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white text-center"
                        />
                      </div>
                      {/* Kiri */}
                      <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden text-sm shadow-sm bg-white dark:bg-gray-900">
                        <span className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-555 border-r border-gray-300 dark:border-gray-700 select-none flex items-center justify-center min-w-[60px]">Kiri</span>
                        <input
                          type="number"
                          value={formData.margin_kiri}
                          onChange={(e) => setFormData({ ...formData, margin_kiri: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variabel Cepat */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variabel Cepat:</label>
                    <div className="flex flex-wrap gap-2">
                      {templateSubTab === 'peserta_didik' ? (
                        <>
                          {[
                            { label: 'Nomor Surat Resmi', value: '{{nomor_surat}}' },
                            { label: 'Tanggal Cetak (Indo)', value: '{{tanggal_surat}}' },
                            { label: 'Tahun Ajaran Aktif', value: '{{tahun}}' },
                            { label: 'Nama Lengkap', value: '{{nama_lengkap}}' },
                            { label: 'NISN', value: '{{nisn}}' },
                            { label: 'NIPD / Stambuk', value: '{{nipd}}' },
                            { label: 'NIK Peserta Didik', value: '{{nik}}' },
                            { label: 'Kelas (Rombel)', value: '{{kelas}}' },
                            { label: 'Tempat, Tgl Lahir', value: '{{tempat_lahir}}, {{tanggal_lahir}}' }
                          ].map((v) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => insertQuickVariable(v.value)}
                              className="px-3.5 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-55 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-650 dark:text-gray-350 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                            >
                              {v.label}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          {[
                            { label: 'Nomor Surat Resmi', value: '{{nomor_surat}}' },
                            { label: 'Tanggal Cetak (Indo)', value: '{{tanggal_surat}}' },
                            { label: 'Tahun Ajaran Aktif', value: '{{tahun}}' },
                            { label: 'Nama Lengkap', value: '{{nama_lengkap}}' },
                            { label: 'NIP', value: '{{nip}}' },
                            { label: 'NUPTK', value: '{{nuptk}}' },
                            { label: 'Jabatan', value: '{{jabatan}}' },
                            { label: 'Unit Kerja', value: '{{unit_kerja}}' }
                          ].map((v) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => insertQuickVariable(v.value)}
                              className="px-3.5 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-55 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-650 dark:text-gray-350 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                            >
                              {v.label}
                            </button>
                          ))}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const vars = templateSubTab === 'peserta_didik' 
                            ? [
                                '{{nama_sekolah}}', '{{alamat_sekolah}}', '{{telepon_sekolah}}',
                                '{{nomor_surat}}', '{{tanggal_surat}}', '{{tahun}}',
                                '{{nama_lengkap}}', '{{nisn}}', '{{nipd}}', '{{nik}}',
                                '{{tempat_lahir}}', '{{tanggal_lahir}}', '{{jenis_kelamin}}',
                                '{{kelas}}', '{{alamat}}', '{{nama_ayah}}', '{{nama_ibu}}'
                              ]
                            : [
                                '{{nama_sekolah}}', '{{alamat_sekolah}}', '{{telepon_sekolah}}',
                                '{{nomor_surat}}', '{{tanggal_surat}}', '{{tahun}}',
                                '{{nama_lengkap}}', '{{nip}}', '{{nuptk}}',
                                '{{jabatan}}', '{{unit_kerja}}'
                              ];
                          
                          const buttonsHtml = vars.map(v => `
                            <button onclick="window.handleInsertTemplateVariable('${v}')" 
                                    class="w-full text-left px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-mono text-xs transition cursor-pointer shadow-sm flex items-center justify-between">
                              <span>${v}</span>
                              <span class="text-[9px] bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 px-2.5 py-1 rounded-md font-sans font-bold uppercase tracking-wider">Pilih</span>
                            </button>
                          `).join('');

                          Swal.fire({
                            title: 'Daftar Semua Variabel',
                            html: `
                              <div class="text-left text-sm p-1 max-h-[350px] overflow-y-auto pr-1">
                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Klik pada variabel di bawah untuk menyisipkannya langsung ke dalam template editor.</p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  ${buttonsHtml}
                                </div>
                              </div>
                            `,
                            showConfirmButton: true,
                            confirmButtonText: 'Tutup',
                            confirmButtonColor: '#465fff',
                          });
                        }}
                        className="px-4 py-1.5 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-brand-500 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Lihat Semua
                      </button>
                    </div>
                  </div>

                  {/* HTML/Paper editor container */}
                  <div className="space-y-2">
                    <div className="bg-gray-700 dark:bg-gray-800 p-5 rounded-2xl border border-gray-600 dark:border-gray-700 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="px-3.5 py-1.5 bg-white text-gray-900 rounded-lg text-[10px] font-extrabold tracking-wider shadow-sm select-none">
                          HALAMAN 1
                        </span>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-800 overflow-hidden shadow-lg">
                        <textarea
                          id="template-editor-textarea"
                          defaultValue={formData.konten_html}
                          className="w-full min-h-[550px] hidden"
                        />
                      </div>
                    </div>

                    {/* Add manual page button */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (editorRef.current) {
                            editorRef.current.execCommand('mceInsertContent', false, '<div style="page-break-before: always; border-top: 2px dashed #9ca3af; margin: 40px 0; padding-top: 40px;"></div>');
                            setFormData((prev: any) => ({
                              ...prev,
                              konten_html: editorRef.current.getContent()
                            }));
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-750 text-gray-700 dark:text-gray-355 font-bold rounded-lg hover:bg-gray-55 dark:hover:bg-gray-855 transition shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Halaman Manual
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleSaveTemplate()}
                      className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg shadow transition cursor-pointer text-sm"
                    >
                      {editId ? 'Perbarui Template' : 'Simpan Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetTemplateForm(templateSubTab === 'peserta_didik' ? 0 : 1)}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-55 dark:hover:bg-gray-800 transition cursor-pointer text-sm"
                    >
                      Batal
                    </button>
                  </div>
                </div>

                {/* Right Column: Daftar Template Cards */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Template</h2>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[80vh] pr-2 no-scrollbar">
                    {filteredTemplates.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">
                        Belum ada template {templateSubTab === 'peserta_didik' ? 'peserta didik' : 'GTK'}.
                      </div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <div
                          key={t.template_surat_id}
                          className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition ${
                            editId === t.template_surat_id
                              ? 'border-brand-500 bg-brand-50/10'
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                              {t.nama_template}
                            </h3>
                            <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-550 dark:text-gray-400 rounded text-[10px] font-bold uppercase tracking-tight">
                              {getKertasName(t.ukuran_kertas)}
                            </span>
                          </div>

                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleLoadTemplateForEdit(t)}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition cursor-pointer shadow-sm"
                              title="Edit"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplateItem(t.template_surat_id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg transition cursor-pointer shadow-sm"
                              title="Hapus"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              {/* TAB 1: PENGATURAN NOMOR LIST */}
              {currentTab === 'pengaturan' && (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Kategori</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Label</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Format Nomor</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Counter Sekarang</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {pengaturans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-gray-400">Belum ada pengaturan penomoran surat.</TableCell>
                        </TableRow>
                      ) : (
                        pengaturans.map((p) => (
                          <TableRow key={p.pengaturan_nomor_surat_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                            <TableCell className="px-5 py-3.5 font-semibold text-gray-800 dark:text-white/80 text-sm">{getKategoriName(p.kategori)}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80"><span className="px-2.5 py-1 rounded bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-bold">{p.nama_label}</span></TableCell>
                            <TableCell className="px-5 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-400">{p.format_nomor}</TableCell>
                            <TableCell className="px-5 py-3.5 font-bold text-gray-800 dark:text-white/80 text-sm">{String(p.counter).padStart(3, '0')}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.aktif ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {p.aktif ? 'Aktif' : 'Non-Aktif'}
                              </span>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-right space-x-2">
                              <button onClick={() => handleOpenEdit(p)} className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Edit</button>
                              <button onClick={() => handleDelete(p.pengaturan_nomor_surat_id)} className="text-red-500 hover:text-red-700 font-medium cursor-pointer">Hapus</button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}


          {/* TAB 3: SURAT MASUK LIST */}
          {currentTab === 'masuk' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">No. Agenda</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tanggal Terima</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">No & Tanggal Surat</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Asal & Perihal</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Penerima Disposisi</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Berkas</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {inbounds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-400">Belum ada surat masuk tercatat.</TableCell>
                    </TableRow>
                  ) : (
                    inbounds.map((item) => (
                      <TableRow key={item.surat_masuk_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-3.5 font-semibold text-brand-600 dark:text-brand-400">{item.nomor_agenda}</TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{formatDateDMY(item.tanggal_diterima)}</TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.nomor_surat}</div>
                          <div className="text-xs text-gray-500">{formatDateDMY(item.tanggal_surat)}</div>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.perihal}</div>
                          <div className="text-xs text-gray-500 font-medium">Asal: {item.asal_surat}</div>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/80 text-sm">{item.tujuan_disposisi}</TableCell>
                        <TableCell className="px-5 py-3.5 text-center">
                          {item.file_url ? (
                            <a href={item.file_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-700 transition font-bold text-xs inline-flex items-center justify-center gap-1">
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              LIHAT
                            </a>
                          ) : <span className="text-gray-400 italic">Tidak ada</span>}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-right">
                           <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition cursor-pointer" title="Edit"><PencilIcon className="size-4" /></button>
                            <button onClick={() => handleDelete(item.surat_masuk_id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition cursor-pointer" title="Hapus"><TrashBinIcon className="size-4" /></button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TAB 4 & 5: SURAT KELUAR & ARSIP LIST */}
          {(currentTab === 'keluar' || currentTab === 'arsip') && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">No. Surat</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tanggal</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Template & Perihal</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Target Penerima</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {outbounds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-400">Belum ada arsip surat.</TableCell>
                    </TableRow>
                  ) : (
                    outbounds.map((item) => (
                      <TableRow key={item.surat_keluar_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-800 dark:text-white/85">
                          {item.nomor_surat || <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded font-sans text-[10px] font-bold">[ DRAFT ]</span>}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{formatDateDMY(item.tanggal_surat)}</TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.perihal}</div>
                          <div className="text-xs text-gray-500">Template: {item.template_surat?.nama_template || '-'}</div>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                          {item.kategori === 0 ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white">{item.peserta_didik?.nama || '-'}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-tight">Peserta Didik</span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white">{item.gtk?.nama || '-'}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-tight">Guru / Tenaga Kependidikan</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                            (item.status === 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400')
                          }`}>
                            {item.status === 1 ? 'DRAFT' : (item.status === 2 ? 'TERBIT' : 'DIBATALKAN')}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handlePreview(item.surat_keluar_id)} className="p-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 transition cursor-pointer" title="Preview & Cetak"><PrinterIcon className="size-4" /></button>
                            {item.status === 1 && (
                              <>
                                <button onClick={() => handlePublish(item.surat_keluar_id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition cursor-pointer" title="Terbitkan"><CheckCircleIcon className="size-4" /></button>
                                <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition cursor-pointer" title="Edit"><PencilIcon className="size-4" /></button>
                                <button onClick={() => handleDelete(item.surat_keluar_id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition cursor-pointer" title="Hapus"><TrashBinIcon className="size-4" /></button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {['masuk', 'keluar', 'arsip'].includes(currentTab) && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/10">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold cursor-pointer"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )}
</div>

      {/* MODAL EDIT/CREATE FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-zoom-in">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editId ? 'Edit Data' : 'Tambah Data'} {modalType === 'pengaturan' ? 'Pengaturan Nomor' : (modalType === 'template' ? 'Template Surat' : (modalType === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'))}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* FORM 1: PENGATURAN NOMOR */}
              {modalType === 'pengaturan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kategori Surat</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="0">Peserta Didik</option>
                      <option value="1">GTK</option>
                      <option value="2">SK Sekolah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Label (Kode Surat)</label>
                    <input
                      type="text"
                      placeholder="Contoh: SKL, SK, SPT, SPD"
                      value={formData.nama_label}
                      onChange={(e) => setFormData({ ...formData, nama_label: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Format Nomor Surat</label>
                    <input
                      type="text"
                      placeholder="Contoh: {NO}/SMKN1/{LABEL}/{ROMAWI}/{TAHUN}"
                      value={formData.format_nomor}
                      onChange={(e) => setFormData({ ...formData, format_nomor: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Dukung variabel otomatis: <code className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded font-mono text-red-500 font-bold">{'{NO}'}</code> (counter), <code className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded font-mono text-red-500 font-bold">{'{LABEL}'}</code>, <code className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded font-mono text-red-500 font-bold">{'{ROMAWI}'}</code>, <code className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded font-mono text-red-500 font-bold">{'{BULAN}'}</code>, dan <code className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded font-mono text-red-500 font-bold">{'{TAHUN}'}</code>.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Counter Awal</label>
                    <input
                      type="number"
                      value={formData.counter}
                      onChange={(e) => setFormData({ ...formData, counter: Number(e.target.value) })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <input
                      type="checkbox"
                      id="aktif"
                      checked={formData.aktif}
                      onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                      className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-400"
                    />
                    <label htmlFor="aktif" className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Pengaturan Aktif</label>
                  </div>
                </div>
              )}



              {/* FORM 3: SURAT MASUK */}
              {modalType === 'masuk' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nomor Agenda</label>
                    <input
                      type="text"
                      placeholder="Contoh: 001/AGENDA/2026"
                      value={formData.nomor_agenda}
                      onChange={(e) => setFormData({ ...formData, nomor_agenda: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nomor Surat Masuk</label>
                    <input
                      type="text"
                      placeholder="Contoh: 104.2/SMKN-1/V/2026"
                      value={formData.nomor_surat}
                      onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanggal Surat</label>
                    <input
                      type="date"
                      value={formData.tanggal_surat}
                      onChange={(e) => setFormData({ ...formData, tanggal_surat: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanggal Diterima</label>
                    <input
                      type="date"
                      value={formData.tanggal_diterima}
                      onChange={(e) => setFormData({ ...formData, tanggal_diterima: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Asal Surat</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dinas Pendidikan Provinsi"
                      value={formData.asal_surat}
                      onChange={(e) => setFormData({ ...formData, asal_surat: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Penerima Disposisi / Tujuan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kepala Sekolah / Kasubag TU"
                      value={formData.tujuan_disposisi}
                      onChange={(e) => setFormData({ ...formData, tujuan_disposisi: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Perihal</label>
                    <input
                      type="text"
                      placeholder="Contoh: Undangan Rapat Koordinasi BOS"
                      value={formData.perihal}
                      onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL File Berkas Surat (PDF/Gambar)</label>
                    <input
                      type="text"
                      placeholder="Masukkan URL/Path file berkas surat..."
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Keterangan / Catatan</label>
                    <textarea
                      placeholder="Tulis ringkasan atau disposisi surat..."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* FORM 4: SURAT KELUAR */}
              {modalType === 'keluar' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilih Template Surat</label>
                      <select
                        value={formData.template_surat_id}
                        onChange={(e) => {
                          const tempId = e.target.value;
                          const selectedTemp = templates.find((t) => t.template_surat_id === tempId);
                          // Automatically match settings based on category of template
                          const matchedConfig = numberConfigs.find((n) => n.kategori === selectedTemp?.kategori);

                          setFormData({
                            ...formData,
                            template_surat_id: tempId,
                            pengaturan_nomor_surat_id: matchedConfig?.pengaturan_nomor_surat_id || '',
                          });
                        }}
                        required
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">-- Pilih Template Master --</option>
                        {templates.map((t) => (
                          <option key={t.template_surat_id} value={t.template_surat_id}>
                            {t.nama_template} ({getKategoriName(t.kategori)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilih Aturan Penomoran</label>
                      <select
                        value={formData.pengaturan_nomor_surat_id}
                        onChange={(e) => setFormData({ ...formData, pengaturan_nomor_surat_id: e.target.value })}
                        required
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">-- Pilih Format Nomor --</option>
                        {numberConfigs.map((n) => (
                          <option key={n.pengaturan_nomor_surat_id} value={n.pengaturan_nomor_surat_id}>
                            [{n.nama_label}] - {n.format_nomor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanggal Surat</label>
                      <input
                        type="date"
                        value={formData.tanggal_surat}
                        onChange={(e) => setFormData({ ...formData, tanggal_surat: e.target.value })}
                        required
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Perihal</label>
                      <input
                        type="text"
                        placeholder="Contoh: Undangan Ujian Akhir Rapor"
                        value={formData.perihal}
                        onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                        required
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Target Recipient selection based on template category */}
                  {(() => {
                    const activeTemp = templates.find((t) => t.template_surat_id === formData.template_surat_id);
                    if (activeTemp?.kategori === 0) {
                      // Student Category
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-900 animate-fade-in">
                          <div>
                            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Filter Rombel (Kelas)</label>
                            <select
                              value={selectedRombel}
                              onChange={(e) => setSelectedRombel(e.target.value)}
                              className="w-full border border-blue-300 dark:border-blue-700 rounded-lg p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              <option value="">-- Pilih Rombel --</option>
                              {rombels.map((r) => (
                                <option key={r.rombongan_belajar_id} value={r.nama}>
                                  {r.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Pilih Peserta Didik</label>
                            <select
                              value={formData.peserta_didik_id}
                              onChange={(e) => setFormData({ ...formData, peserta_didik_id: e.target.value })}
                              required
                              className="w-full border border-blue-300 dark:border-blue-700 rounded-lg p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              <option value="">-- Pilih Peserta Didik --</option>
                              {students.map((s) => (
                                <option key={s.peserta_didik_id} value={s.peserta_didik_id}>
                                  {s.nama} (NISN: {s.nisn})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    } else if (activeTemp?.kategori === 1) {
                      // GTK Category
                      return (
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-xl border border-purple-200 dark:border-purple-900 animate-fade-in">
                          <label className="block text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Pilih GTK (Guru/Tendik)</label>
                          <select
                            value={formData.ptk_id}
                            onChange={(e) => setFormData({ ...formData, ptk_id: e.target.value })}
                            required
                            className="w-full border border-purple-300 dark:border-purple-700 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            <option value="">-- Pilih GTK --</option>
                            {gtks.map((g) => (
                              <option key={g.ptk_id} value={g.ptk_id}>
                                {g.nama} ({g.jabatan_gtk || g.jenis_ptk})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    } else if (activeTemp?.kategori === 2) {
                      return (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs text-gray-500 border border-gray-200 dark:border-gray-700">
                          SK Internal Sekolah tidak memerlukan relasi target data Peserta Didik maupun GTK.
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-5 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition font-semibold shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW SURAT & PRINT MODAL */}
      {previewSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-5xl h-[95vh] flex flex-col animate-zoom-in">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Preview Cetak Resmi Surat</h2>
                <p className="text-xs text-gray-500 mt-0.5">No: {previewSurat.nomor_surat}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-1 cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm0-11V4a2 2 0 012-2h4a2 2 0 012 2v10H9z" />
                  </svg>
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setPreviewSurat(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold cursor-pointer text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Paper Preview Sheet Workspace */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-y-auto p-8 flex justify-center">
              <iframe
                id="print-preview-frame"
                title="Preview Surat"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      @page {
                        size: ${previewSurat.ukuran_kertas === 1 ? 'A4' : (previewSurat.ukuran_kertas === 2 ? 'F4' : (previewSurat.ukuran_kertas === 3 ? 'letter' : 'legal'))};
                        margin: ${previewSurat.margin.atas}mm ${previewSurat.margin.kanan}mm ${previewSurat.margin.bawah}mm ${previewSurat.margin.kiri}mm;
                      }
                      body {
                        font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        color: #000;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                      }
                      /* Print overrides */
                      @media print {
                        body {
                          background: #fff;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    ${previewSurat.konten_html}
                  </body>
                  </html>
                `}
                className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-gray-300 dark:border-gray-800 shadow-md rounded"
                style={{
                  paddingTop: `${previewSurat.margin.atas}mm`,
                  paddingBottom: `${previewSurat.margin.bawah}mm`,
                  paddingLeft: `${previewSurat.margin.kiri}mm`,
                  paddingRight: `${previewSurat.margin.kanan}mm`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default SuratData;
