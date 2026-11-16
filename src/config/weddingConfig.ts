/**
 * ============================================================================
 * KONFIGURASI UTAMA KAD JEMPUTAN — ROYAL MALAY PALACE
 * ============================================================================
 * Kemas kini fail ini untuk:
 * 1. Memasukkan gambar potret pasangan pengantin pada masa hadapan
 *    (`couplePortraitUrl`). Biarkan "" buat masa ini untuk memaparkan bingkai
 *    emas antik kosong yang eksklusif.
 * 2. Menyambungkan borang RSVP ke Google Forms & Google Sheets sebenar.
 * ============================================================================
 */

export interface GoogleFormsEntryMap {
  /** ID medan Nama Penuh Tetamu (contoh: "entry.123456789") */
  fullName: string;
  /** ID medan Status Kehadiran (contoh: "entry.234567890") */
  attendance: string;
  /** ID medan Jumlah Pax (contoh: "entry.345678901") */
  pax: string;
  /** ID medan Nombor Telefon (contoh: "entry.456789012") */
  phone: string;
  /** ID medan Nama Ahli Keluarga / Tetamu Tambahan (contoh: "entry.567890123") */
  additionalGuests: string;
  /** ID medan Ucapan kepada Pengantin (contoh: "entry.678901234") */
  wishes: string;
}

export interface FamilyContact {
  label: string;
  displayNumber: string;
  telHref: string;
  waHref: string;
}

export interface FamilyContactGroup {
  heading: string;
  contacts: FamilyContact[];
}

export interface WeddingConfig {
  designIdentity: {
    themeName: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
  couple: {
    groomFullName: string;
    groomGivenName: string;
    groomParentage: string;
    brideFullName: string;
    brideGivenName: string;
    brideParentage: string;
    monogram: string;
    /**
     * LALUAN GAMBAR POTRET PENGANTIN:
     * Biarkan string kosong "" buat masa ini (tiada gambar pasangan lagi).
     * Apabila anda bersedia kelak, masukkan URL atau laluan gambar
     * (contoh: "/images/potret-pengantin.jpg") di sini.
     */
    couplePortraitUrl: string;
    couplePortraitAlt: string;
  };
  bridesParents: {
    fatherName: string;
    motherName: string;
  };
  groomsParents: {
    fatherName: string;
    motherName: string;
  };
  familyContacts: {
    brideSide: FamilyContactGroup;
    groomSide: FamilyContactGroup;
  };
  invitationCopy: {
    gratitudeHeading: string;
    familyInvitationText: string;
  };
  event: {
    title: string;
    dateDisplayMs: string;
    timeDisplayMs: string;
    /** Tarikh dan masa mula majlis dalam zon masa Malaysia (UTC+8) untuk kiraan detik */
    isoStartDateTime: string;
    isoEndDateTime: string;
    venueName: string;
    fullAddress: string;
    googleMapsUrl: string;
  };
  rsvpGoogleForms: {
    /**
     * TUKAR KEPADA `true` HANYA SELEPAS ANDA MEMASUKKAN PAUTAN GOOGLE FORMS SEBENAR
     * DAN MENGUJI PENGHANTARAN KE GOOGLE SHEETS.
     */
    isConfigured: boolean;
    /**
     * URL Tindakan Borang Google Forms (berakhir dengan `/formResponse`)
     * Contoh: "https://docs.google.com/forms/d/e/1FAIpQLScXXXXXXXXXXXX/formResponse"
     */
    formResponseUrl: string;
    /**
     * Pautan Awam Google Forms (berakhir dengan `/viewform`) sebagai sandaran pautan terus
     * Contoh: "https://docs.google.com/forms/d/e/1FAIpQLScXXXXXXXXXXXX/viewform"
     */
    publicFormUrl: string;
    /**
     * Pemetaan `entry.XXXX` daripada pautan "Get pre-filled link" Google Forms anda.
     */
    entryIds: GoogleFormsEntryMap;
  };
  music: {
    youtubeVideoId: string;
    customTrackUrl: string;
    trackTitle: string;
  };
}

export const WEDDING_CONFIG: WeddingConfig = {
  designIdentity: {
    themeName: 'ROYAL MALAY PALACE',
    primaryColor: '#064E3B',
    secondaryColor: '#C6A15B',
    backgroundColor: '#F5F0E5',
  },
  couple: {
    groomFullName: 'PUTERA FAIZAL HAKIMI BIN MOHD RAFAEL',
    groomGivenName: 'PUTERA FAIZAL HAKIMI',
    groomParentage: 'BIN MOHD RAFAEL',
    brideFullName: 'NUR ZAIREEN FARISYA BINTI MOHD ZAIDI',
    brideGivenName: 'NUR ZAIREEN FARISYA',
    brideParentage: 'BINTI MOHD ZAIDI',
    monogram: 'Z&P',
    couplePortraitUrl:
      '/assets/aistudio/WhatsApp_Image_2026-11-15_at_9.57.57_PM__1__ca5ce5bd.jpeg',
    couplePortraitAlt:
      'Ilustrasi Potret Pasangan Mempelai — Nur Zaireen Farisya & Putera Faizal Hakimi',
  },
  bridesParents: {
    fatherName: 'MOHD. ZAIDI BIN CHIK',
    motherName: 'FAUZIAH BINTI AWANG',
  },
  groomsParents: {
    fatherName: 'MOHD RAFAEL BIN ABDULLAH',
    motherName: 'ROSMANI BINTI TAIB',
  },
  familyContacts: {
    brideSide: {
      heading: 'CONTACT PENGANTIN BELAH PEREMPUAN',
      contacts: [
        {
          label: 'Ayah',
          displayNumber: '+60 19-702 6125',
          telHref: 'tel:+60197026125',
          waHref: 'https://wa.me/60197026125',
        },
        {
          label: 'Ibu',
          displayNumber: '0135471975',
          telHref: 'tel:+60135471975',
          waHref: 'https://wa.me/60135471975',
        },
      ],
    },
    groomSide: {
      heading: 'CONTACT PENGANTIN BELAH LELAKI',
      contacts: [
        {
          label: 'Along',
          displayNumber: '+60 12-743 4378',
          telHref: 'tel:+60127434378',
          waHref: 'https://wa.me/60127434378',
        },
        {
          label: 'Kak Long Ayu',
          displayNumber: '+60 17-743 4318',
          telHref: 'tel:+60177434318',
          waHref: 'https://wa.me/60177434318',
        },
      ],
    },
  },
  invitationCopy: {
    gratitudeHeading: 'DENGAN PENUH KESYUKURAN',
    familyInvitationText:
      'Dengan penuh kesyukuran ke hadrat Allah SWT, kami dengan segala hormat dan sukacitanya menjemput Tuan/Puan serta seisi keluarga untuk hadir memeriahkan majlis walimatulurus puteri kami.',
  },
  event: {
    title: 'MAJLIS WALIMATULURUS',
    dateDisplayMs: 'SABTU, 12 DISEMBER 2026',
    timeDisplayMs: '6.30 PETANG – 11.00 MALAM',
    isoStartDateTime: '2026-12-12T18:30:00+08:00',
    isoEndDateTime: '2026-12-12T23:00:00+08:00',
    venueName: 'LAMAN RATU EVENT HALL',
    fullAddress:
      "NO. 37 & 39, JALAN EKOPERNIAGAAN 3, TAMAN KOTA MASAI, 81700 PASIR GUDANG, JOHOR DARUL TA'ZIM, MALAYSIA.",
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=LAMAN+RATU+EVENT+HALL+NO+37+%26+39+JALAN+EKOPERNIAGAAN+3+TAMAN+KOTA+MASAI+81700+PASIR+GUDANG+JOHOR+MALAYSIA',
  },
  rsvpGoogleForms: {
    isConfigured: true,
    formResponseUrl: '',
    publicFormUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSfMlFQD-WCJ5GxMzKGWHOxeT-3W-1AcEZfSTl6eh8wKyWBj2w/viewform',
    entryIds: {
      fullName: '',
      attendance: '',
      pax: '',
      phone: '',
      additionalGuests: '',
      wishes: '',
    },
  },
  music: {
    /**
     * ID VIDEO YOUTUBE UNTUK LAGU LATAR:
     * Lagu pilihan: https://www.youtube.com/watch?v=vBkfMPeYJBE
     * Jika mahu guna fail MP3 sendiri, kosongkan youtubeVideoId dan isi customTrackUrl.
     */
    youtubeVideoId: 'vBkfMPeYJBE',
    customTrackUrl: '',
    trackTitle: 'Young Berry Lee — Umbrella',
  },
};
