/* ── RECON 2026 — all event content ──────────────────────────── */

export interface SiteEvent {
    title: string;
    description: string;
    tags: string[];
    meta: string[];
    flagship?: boolean;
}

export interface ScheduleItem {
    time: string;
    title: string;
    description: string;
    accent?: boolean;
}

export interface TeamMember {
    code: string;
    name: string;
    role: string;
    photo?: string;
}

export interface Speaker {
    name: string;
    handle?: string;
    role: string;
    bio: string;
    badges?: string[];
    photo?: string;
    url?: string;
}

export interface Mentor {
    name: string;
    handle?: string;
    role: string;
    bio: string;
    photo?: string;
    url?: string;
}

export interface Partner {
    name: string;
    description: string;
    value?: string;
    tier: 'title' | 'co-title' | 'strategic' | 'technical' | 'gold' | 'silver' | 'community';
    logo: string;
    url: string;
    /** Relative display height of the logo: sm=32px, md=40px, lg=48px */
    size?: 'sm' | 'md' | 'lg';
    /** Color treatment: 'invert' = logo is dark/black (white variant used); 'brighten' = logo is faint; 'glow' = add light glow for dark text */
    fix?: 'invert' | 'brighten' | 'glow';
}

/* ── Stats ────────────────────────────────────────────────────── */
export const EVENT_DATE_RANGE_READABLE = '19th to 21st April 2026';
export const EVENT_DATE_RANGE_LABEL = '19-21 APR 2026';

export const stats = [
    { label: 'Prize Pool', value: 1.5, prefix: '₹', suffix: 'M+', display: '₹1.5M+' },
    { label: 'Hackers', value: 600, suffix: '+', display: '600+' },
    { label: 'Events', value: 12, display: '12' },
    { label: 'Days', value: 3, display: '3' },
];

/* ── Flagship Events ──────────────────────────────────────────── */
export const flagshipEvents: SiteEvent[] = [
    {
        title: 'Capture The Flag',
        description:
            'Jeopardy-style CTF across Web, Pwn, Reversing, Crypto, Forensics, OSINT & more. 12-hour overnight sprint — top teams win cash, swag & bragging rights.',
        tags: ['OVERNIGHT', '12 HRS', 'JEOPARDY'],
        meta: ['Team size: 1-4', 'Prizes: ₹80,000+'],
        flagship: true,
    },
    {
        title: 'King of the Hill',
        description:
            'Attack-defence arena. Exploit boxes, patch vulns, maintain access — all while opponents try to dethrone you. 8-hour overnight warzone.',
        tags: ['OVERNIGHT', '8 HRS', 'ATTACK-DEFENCE'],
        meta: ['Team size: 1-3', 'Prizes: ₹50,000+'],
        flagship: true,
    },
];

/* ── Side Events ──────────────────────────────────────────────── */
export const sideEvents: SiteEvent[] = [
    {
        title: 'NFC Lock Hunt',
        description: 'Clone NFC badges, crack access controls, and hunt hidden locks across campus in this physical-security challenge.',
        tags: ['HARDWARE', 'PHYSICAL'],
        meta: [],
    },
    {
        title: 'Hardware Badge & IoT Village',
        description: 'Solder your own conference badge. Explore IoT exploitation stations — firmware extraction, UART/JTAG, wireless sniffing.',
        tags: ['HARDWARE', 'HANDS-ON'],
        meta: [],
    },
    {
        title: 'App Sec Zone',
        description: 'Guided web & mobile app pentesting labs. OWASP Top 10, API abuse, auth bypass — learn by breaking real apps.',
        tags: ['WEB', 'MOBILE'],
        meta: [],
    },
    {
        title: 'Media Forensics',
        description: 'Detect manipulated images, analyse metadata, uncover deepfakes. Digital forensics meets AI deception.',
        tags: ['FORENSICS', 'AI'],
        meta: [],
    },
    {
        title: 'Hacking Arena',
        description: 'Speed-hacking stages with escalating difficulty. Race the clock, solve challenges, climb the scoreboard.',
        tags: ['SPEED', 'COMPETITIVE'],
        meta: [],
    },
    {
        title: 'Cyber Expo',
        description: 'Industry booths, live demos, recruiter meet-ups. See cutting-edge security tools in action.',
        tags: ['EXPO', 'NETWORKING'],
        meta: [],
    },
    {
        title: 'Escape Room',
        description: 'Cyber-themed escape room. Decode ciphers, exploit systems, escape before time runs out.',
        tags: ['PUZZLE', 'TEAM'],
        meta: [],
    },
    {
        title: 'Gaming Arena',
        description: 'Competitive gaming zone. Valorant, CS2 & more — blow off steam between hacking sessions.',
        tags: ['GAMING', 'CASUAL'],
        meta: [],
    },
    {
        title: 'Art Zone',
        description: 'Cyberpunk art installations, live pixel art, and creative coding demos. Where hacker culture meets art.',
        tags: ['CREATIVE', 'ART'],
        meta: [],
    },
];

/* ── Schedule ─────────────────────────────────────────────────── */
export const schedule: Record<string, ScheduleItem[]> = {
    'Day 1': [
        { time: '09:00', title: 'Gates Open', description: 'Registration desks at AB2 ground floor' },
        { time: '10:00', title: 'Introduction Session', description: '10:00-11:00 at AB2 Auditorium' },
        { time: '11:00', title: 'Transition', description: 'Move to CB 305 for the speaker track' },
        { time: '11:30', title: 'Talk 1: Execution Hijacking', description: 'Ansh Bhawanani, CB 305' },
        { time: '13:00', title: 'Lunch Break', description: '13:00-13:45 at respective hostels' },
        { time: '14:00', title: 'Talk 2: Beyond Detection', description: 'Nithin Chenthur Prabhu, CB 305' },
        { time: '15:30', title: 'Zone Exploration', description: 'Free time to explore zones until 17:15' },
        { time: '17:30', title: 'CTF Briefing', description: '17:30-18:00 rules and kickoff briefing' },
        { time: '18:00', title: 'CTF Begins', description: 'Overnight CTF runs until 06:00', accent: true },
    ],
    'Day 2': [
        { time: '06:00', title: 'CTF Closing Announcements', description: '06:00-06:30 results and wrap-up' },
        { time: '06:30', title: 'Leaderboard Update', description: '06:30-07:00 final standings refresh' },
        { time: '07:00', title: 'Breakfast', description: '07:00-08:00 recovery break' },
        { time: '08:00', title: 'Rest Time', description: '08:00-10:00 participant downtime' },
        { time: '10:00', title: 'Talk 1: Research and Career Opportunities for Security Operations Centers', description: 'Dr. Praveen Kumar E, 10:00-11:30' },
        { time: '12:00', title: 'Talk 2: Understanding & Investigating Web Shell Attacks', description: 'Abhiram Kumar, 12:00-13:00' },
        { time: '13:00', title: 'Lunch Break', description: '13:00-14:00 at respective hostels' },
        { time: '14:00', title: 'Talk 3: Drawing Parallels Between iOS and macOS Pentesting with DVMA', description: 'Vaibhav Lakhani, 14:00-15:00' },
        { time: '15:00', title: 'Sponsored Special Event', description: '15:00-18:00 featured sponsor session' },
        { time: '18:00', title: 'Zone Events', description: '18:00-20:00 side events across zones' },
        { time: '20:00', title: 'King of the Hill', description: '20:00-04:00 overnight attack-defence', accent: true },
    ],
    'Day 3': [
        { time: '04:00', title: 'Rest Time', description: '04:00-10:00 participant recovery window' },
        { time: '10:00', title: 'Game Hacking Arena', description: '10:00-11:00 final interactive session' },
        { time: '11:00', title: 'Closing Notes & Winners', description: '11:00-13:00 announcements and event closure', accent: true },
    ],
};

/* ── Team ──────────────────────────────────────────────────────── */
export const team: TeamMember[] = [
    { code: 'ED', name: 'Rikhil', role: 'Executive Director', photo: 'https://media.licdn.com/dms/image/v2/D5603AQHmSw8t-AHLJA/profile-displayphoto-shrink_400_400/B56ZT77H3CHQAk-/0/1739393369312?e=1777507200&v=beta&t=iS3sMqyugkbqep3882NAUyz1OKLCE3KZz5axZj41RRY' },
    { code: 'CTO', name: 'Abhiram', role: 'Chief Technology Officer', photo: 'https://media.licdn.com/dms/image/v2/D5603AQEZXk7JGQifNw/profile-displayphoto-scale_400_400/B56Zyzrx3iGoAg-/0/1772541129853?e=1777507200&v=beta&t=MmoT_2YwBHna8tUV7_-HNQxLTWkcmguvYhvhbiNU_0U' },
    { code: 'CTFD', name: 'Vikhyat Shajee Nambiar', role: 'CTF Director', photo: '/team/IMG-20260119-WA0056 (1) - Vikhyat(1).jpg' },
    { code: 'EXS', name: 'Tanishq Srivastava', role: 'Executive Secretary', photo: '/team/tanishq-srivastava.jpg' },
    { code: 'INF', name: 'Izhaan Raza', role: 'Infrastructure Lead', photo: '/team/c1bb8b82-5a04-412a-b5e1-7d8303bf43ea - Izhaan Raza.jpeg' },
    { code: 'UIX', name: 'Samradh Agarwal', role: 'UI/UX Lead', photo: '/team/IMG_4433 - SAMRADH AGARWAL 23BCE9250.jpeg' },
    { code: 'OPSB', name: 'Mohammed Faariz', role: 'Operations Chief', photo: '/team/WhatsApp Image 2026-04-16 at 1.03.19 PM - MOHAMMED FAARIZ A 24BCE7839.jpeg' },
    { code: 'OPSA', name: 'Cheppali Chanu', role: 'Operations Chief', photo: '/team/my pic - Chanu.jpeg' },
    { code: 'IOT', name: 'Pradyumna Basa', role: 'IoT Hardware Badge Zone Owner', photo: '/team/IMG_20251225_162435213~2 - Pradyumna Basa.jpg' },
    { code: 'NFC', name: 'Anant Satya Mohit Kavuru', role: 'NFC Zone Owner', photo: '/team/IMG_20260415_235757 - Anant Kavuru.jpg' },
    { code: 'VOL', name: 'A. Dharineesh', role: 'Volunteer Lead', photo: '/team/IMG_5793 - Dharineesh Athikesavan.jpeg' },
    { code: 'SPN', name: 'Ayushi', role: 'Sponsorship and Partnerships Lead', photo: '/team/Screenshot_20260416-101948 - Ayushi Tomar.png' },
    { code: 'ZLDR', name: 'Shrenish Nikhil S', role: 'Zone Leader', photo: '/team/IMG-20260216-WA0021 - SHRENISH NIKHIL S 23BCE7496.jpg' },
    { code: 'EXPO', name: 'Rishwith Gharshakurthi', role: 'Cyber Expo Zone Lead', photo: '/team/IMG-20260416-WA0001~2 - Rishwith Gharshakurthi.jpg' },
    { code: 'DES1', name: 'Anliya Jojo', role: 'Design Core', photo: '/team/20250612212710037 - ANLIYA JOJO.jpeg' },
    { code: 'CORE1', name: 'Varnika Vysyaraju', role: 'Core Command', photo: '/team/IMG_8563 - Varnika Vysyaraju.jpeg' },
    { code: 'CANV', name: 'Sonali Pani', role: 'Zone Owner (Hack the Canvas)', photo: '/team/WhatsApp Image 2026-04-15 at 11.57.34 PM - Sonali Pani.jpeg' },
    { code: 'PSPK', name: 'Aditya J Shettigar', role: 'Program and Speakers Lead', photo: '/team/IMG-20260118-WA0030 - ADITYA J SHETTIGAR 23MIC7018.jpg' },
    { code: 'TECH', name: 'Abhishek Chatterjee', role: 'Technical Core', photo: '/team/IMG_20260102_140110675_MP~2 - ABHISHEK CHATTERJEE 23BCE7903.jpg' },
    { code: 'APSC', name: 'Dibyadyuti Dutta', role: 'AppSec Zone Co-Host', photo: '/team/Photo - Dibyadyuti Dutta.jpeg' },
    { code: 'LOGS', name: 'Reet Mishra', role: 'Volunteers and Logistics Lead', photo: '/team/WhatsApp Image 2026-04-16 at 11.23.51 AM - Reet Mishra.jpeg' },
    { code: 'CTFL', name: 'Swarnim Bandekar', role: 'CTF Lead', photo: '/team/swarnim_profile - SWARNIM BANDEKAR 24BCB7157.jpg' },
    { code: 'ZONE', name: 'Kolluru Sai Abhiram', role: 'Zone Owner', photo: '/team/IMG_20260413_180936 - Jinwoo Sung.jpg' },
    { code: 'DES2', name: 'Piyush Prasad Singh', role: 'Design Core', photo: '/team/me - Piyush P. S.png' },
    { code: 'CORE2', name: 'Adwaidh Dinesh', role: 'Core Command', photo: '/team/IMG-20241031-WA0365 - Adwaidh Dinesh.jpg' },
    { code: 'GAME', name: 'Ryan Shreyas Medikonda', role: 'Gaming Arena Zone Owner', photo: '/team/side event owner - Ryan.jpg' },
];

/* ── Speakers ─────────────────────────────────────────────────── */
export const speakers: Speaker[] = [
    {
        name: 'Vaibhav Lakhani',
        role: 'Senior Consultant, Offensive Security — Kroll | Hack The Box Mumbai',
        bio: 'Senior Consultant in Offensive Security at Kroll and active with Hack The Box Mumbai. Recognized among the top 15 hackers by NCIIPC, with certifications including OSCP, CRTO, CRT, CPSA, CEH, and eJPT. Regular speaker and hands-on trainer focused on iOS/macOS pentesting and modern offensive workflows.',
        badges: ['Kroll', 'Hack The Box Mumbai'],
        url: 'https://github.com/vlakhani28/DVMA',
        photo: '/people/vaibhav-lakhani.webp'
    },
    {
        name: 'Ansh Bhawanani',
        role: 'Creator, Bitten Tech — Cybersecurity Educator',
        bio: 'Creator of Bitten Tech, one of India\'s most-followed cybersecurity channels with 403K+ subscribers. OSCE3-certified and known for practical exploit education, bug bounty strategy, and real-world attack simulations that make advanced offensive concepts accessible to students and professionals alike.',
        badges: ['Bitten Tech', '403K+ Subscribers'],
        photo: '/people/ansh-bhawnani.webp'
    },
    {
        name: 'Nithin Chenthur Prabhu',
        role: 'Associate MDR Analyst — Unit 42, Palo Alto Networks',
        bio: 'Associate MDR Analyst at Unit 42, Palo Alto Networks, with deep focus on DFIR and adversary investigation. Former captain of Team bi0s, author of DFIR Labs, and two-time winner of the Digital Forensics Challenge International (2023 and 2024).',
        badges: ['Unit 42', 'Palo Alto Networks'],
        photo: '/people/nithin-chenthur.webp'
    },
    {
        name: 'Abhiram Kumar',
        role: 'Security Researcher — Palo Alto Networks',
        bio: 'Security researcher at Palo Alto Networks specializing in DFIR and memory forensics. Creator of MemLabs (CTF-style memory forensics labs), former captain of Team bi0s, and organizer of InCTF and bi0sCTF, with extensive experience in web-shell investigation and incident response workflows.',
        badges: ['Palo Alto Networks', 'MemLabs Creator'],
        url: 'https://github.com/stuxnet999',
        photo: '/people/abhiram-kumar-patiballa.webp'
    },
    {
        name: 'Dr. Praveen Kumar E',
        role: 'Senior Security Engineer — Equiniti (EQ) x Notified DM India Pvt Ltd., Bangalore',
        bio: 'Senior Security Engineer based in Bangalore with experience in enterprise security operations, secure engineering practices, and real-world threat response within large-scale product environments.',
        badges: ['Equiniti (EQ)', 'Bangalore'],
        photo: '/people/praveen-kumar-e.webp'
    },
];

/* ── Management / Leadership ──────────────────────────────────── */
export const managementLeadership: Mentor[] = [
    {
        name: 'Dr. G. Viswanathan',
        role: 'Founder & Chancellor, VIT',
        bio: 'Founder and Chancellor of VIT, recognized for shaping VIT into a leading institution for higher education and innovation in India.',
        photo: '/people/dr-g-viswanathan.webp',
    },
    {
        name: 'Dr. Sankar Viswanathan',
        role: 'Vice-President, VIT',
        bio: 'Vice-President at VIT, contributing to institutional strategy, academic growth, and long-term development across campuses.',
        photo: '/people/dr-sankar-viswanathan.webp',
    },
    {
        name: 'Dr. Sekar Viswanathan',
        role: 'Vice-President, VIT',
        bio: 'Vice-President at VIT, supporting leadership initiatives and advancing the university ecosystem through governance and outreach.',
        photo: '/people/dr-sekar-viswanathan.webp',
    },
    {
        name: 'Dr. G. V. Selvam',
        role: 'Vice-President, VIT',
        bio: 'Vice-President at VIT with a focus on academic quality, administration, and strengthening institutional excellence.',
        photo: '/people/dr-g-v-selvam.webp',
    },
    {
        name: 'Dr. Sandhya Pentareddy',
        role: 'Executive Director, VIT-AP',
        bio: 'Executive Director at VIT-AP, leading strategic initiatives and operational growth for the Amaravati campus.',
        photo: '/people/dr-sandhya-pentareddy.webp',
    },
    {
        name: 'Ms. Kadhambari S. Viswanathan',
        role: 'Assistant Vice President, VIT',
        bio: 'Assistant Vice President at VIT, driving innovation-focused initiatives and next-generation academic leadership.',
        photo: '/people/ms-kadhambari-s-viswanathan.webp',
    },
    {
        name: 'Dr. P. Arulmozhivarman',
        role: 'Vice-Chancellor (I/c), VIT-AP',
        bio: 'Vice-Chancellor (I/c) of VIT-AP, leading academic and institutional direction with emphasis on research and innovation.',
        photo: '/people/dr-arulmozhivaram.webp',
    },
    {
        name: 'Dr. Jagadish Chandra Mudiganti',
        role: 'Registrar, VIT-AP',
        bio: 'Registrar at VIT-AP, overseeing key academic and administrative processes for effective institutional operations.',
        photo: '/people/dr-jagadish-chandra-mudiganti.webp',
    },
];

/* ── Mentors ──────────────────────────────────────────────────── */
export const mentors: Mentor[] = [
    // Investigator
    {
        name: 'Prof. Chester Rebeiro',
        role: 'Professor, Dept. of CSE — IIT Madras',
        bio: 'Investigator, RECON 2026. Faculty at IIT Madras specialising in computer security and hardware security.',
        photo: 'https://www.cse.iitm.ac.in/~chester/pubs/chet.png',
        url: 'https://www.cse.iitm.ac.in/~chester/',
    },
    // Conveners
    {
        name: 'Dr. Sibi Chakkaravarthy Sethuraman',
        role: 'Director, Centres of Excellence — VIT-AP',
        bio: 'Convener, RECON 2026. Researcher in cybersecurity, malware analysis, and threat intelligence.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_Sibi_Chakkaravarthy_S_70084_0587_206cccb3ec.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/chakkaravarthy.sibi',
    },
    {
        name: 'Dr. Sudhakar Ilango',
        role: 'Dean, School of Computer Science and Engineering (SCOPE) — VIT-AP',
        bio: 'Convener, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_Sudhakar_Ilango_70087_IMG_4727_SCOPE_68f8caba72.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/sudhakar.ilango',
    },
    {
        name: 'Dr. Hari Seetha',
        role: 'Faculty, School of CSE — VIT-AP',
        bio: 'Convener, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_Hari_Seetha_SCOPE_0741_2b647e6904.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/seetha.hari',
    },
    // Academic leadership
    {
        name: 'Dr. Y. V. Pavan Kumar',
        role: 'Dean, School of Electronics Engineering (SENSE) — VIT-AP',
        bio: 'Dean of SENSE at VIT-AP. Mentor, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/70049_Dr_Y_V_Pavan_Kumar_SENSE_1184_2954015774.avif',
        url: 'https://vitap.ac.in/School%20of%20Electronics%20Engineering%20(SENSE)/faculty/pavankumar.yv',
    },
    {
        name: 'Dr. John Pradeep D',
        role: 'Associate Professor Senior — School of Electronics Engineering (SENSE)',
        bio: 'Mentor, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_John_Pradeep_D_70007_IMG_4713_SENSE_9d6a075b3b.avif',
        url: 'https://vitap.ac.in/School%20of%20Electronics%20Engineering%20(SENSE)/faculty/john.darsy',
    },
    {
        name: 'Dr. Srinivasa Reddy Konda',
        role: 'Assistant Director, CDC — VIT-AP',
        bio: 'Mentor, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/70517_Dr_Srinivasa_Reddy_Konda_SCOPE_1251_c51ac3591e.avif',
        url: 'https://vitap.ac.in/cdc-office',
    },
    // Coordinators
    {
        name: 'Dr. Ajith Jubilson',
        role: 'Associate Professor (Senior) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_E_Ajith_Jubilson_SCOPE_1956_20273c1217.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/ajith.jubilson',
    },
    {
        name: 'Dr. D. Santha Devi',
        role: 'Assistant Professor (Senior Grade 2) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: '/people/Dr_D_Santha_Devi_70602_IMG_4925_SCOPE_a9aff86f50.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/santha.devi',
    },
    {
        name: 'Dr. Ganesh Reddy Karri',
        role: 'Deputy Director, Centre of Excellence — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_Ganesh_Reddy_Karri_70140_IMG_4952_SCOPE_3e82aa165c.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/ganesh.reddy',
    },
    {
        name: 'Dr. Guruprakash Jayabalasamy',
        role: 'Assistant Professor (Senior Grade 2) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: '/people/Dr_Guruprakash_Jayabalasamy_70730_SCOPE_87c529ffc9.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/guruprakash.jayabalasamy',
    },
    {
        name: 'Dr. Kankanala Srinivas',
        role: 'Assistant Professor (Senior Grade 2) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: '/people/Dr. Kankanala Srinivas.webp',
        url: 'https://vitap.ac.in/School%20of%20Electronics%20Engineering%20(SENSE)/faculty/srinivas.kankanala',
    },
    {
        name: 'Dr. Varun Kumar K A',
        role: 'Assistant Professor (Grade 1) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_Varunkumar_Anantharaman_SCOPE_65e381a08d.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/varunkumar.ka',
    },
    {
        name: 'Dr. Kothandaraman D',
        role: 'Associate Professor (Grade 2) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/70647_Dr_D_Kothandaraman_SCOPE_1220_cf0f61fafa.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/kothandaraman.d',
    },
    {
        name: 'Dr. Kumar Debasis',
        role: 'Associate Professor (Grade 1) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/70151_Dr_Kumar_Debasis_SCOPE_1288_d8423a5417.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/kumar.debasis',
    },
    {
        name: 'Dr. M. Krishnasamy',
        role: 'Associate Professor (Grade 1) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: '/people/Dr. M. Krishnasamy.webp',
        url: 'https://vitap.ac.in/School%20of%20Electronics%20Engineering%20(SENSE)/faculty/krishnasamy',
    },
    {
        name: 'Dr. Nandha Kumar R',
        role: 'Deputy Director, CTS — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_R_Nandha_Kumar_IMG_6597_SCOPE_36b1aaa52e.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/nandha.r',
    },
    {
        name: 'Dr. Sudha Ellison Mathe',
        role: 'Director, IIEC — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: '/people/Dr_Sudha_Ellison_Mathe_70078_IMG_5140_SENSE_e65e618ff3.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/sudha.ellison',
    },
    {
        name: 'Dr. Thangam S',
        role: 'Assistant Professor (Senior Grade 1) — VIT-AP',
        bio: 'Coordinator, RECON 2026.',
        photo: 'https://vitap-backend.s3.ap-south-1.amazonaws.com/Dr_THANGAM_SIVANANTHAM_SCOPE_995e08ebc2.avif',
        url: 'https://vitap.ac.in/School%20of%20Computer%20Science%20and%20Engineering%20(SCOPE)/faculty/thangam.s',
    },
];

/* ── Partners ─────────────────────────────────────────────────── */
export const partners: Partner[] = [
    // Title
    { name: 'ISEA', description: 'Information Security Education & Awareness, a CERT-In / MeitY initiative.', tier: 'title', logo: '/logos/isea.webp', url: 'https://isea.gov.in', size: 'md' },
    { name: 'MeitY', description: 'Ministry of Electronics & Information Technology, Government of India.', tier: 'title', logo: '/logos/meity.webp', url: 'https://www.meity.gov.in', size: 'md' },
    { name: 'Hackers Daddy', description: 'Title sponsor — premium cybersecurity training & certifications.', value: '₹7,00,000', tier: 'title', logo: '/logos/hackers-daddy.webp', url: 'https://hackersdaddy.com', size: 'lg', fix: 'brighten' },
    { name: 'IIT Madras', description: 'Academic partner — Indian Institute of Technology Madras.', tier: 'title', logo: '/logos/iit_m.webp', url: 'https://www.iitm.ac.in', size: 'lg' },
    { name: 'VIT-AP University', description: 'Host institution — VIT-AP University, Amaravati.', tier: 'title', logo: '/logos/vitap.webp', url: 'https://vitap.ac.in', size: 'lg', fix: 'brighten' },
    { name: 'APISec University', description: 'API security education platform.', value: '₹7,00,000', tier: 'title', logo: '/logos/apisec.webp', url: 'https://www.apisecuniversity.com', size: 'lg' },
    // Strategic
    { name: 'Magsmen', description: 'Strategic partner — Strategy consultants.', tier: 'strategic', logo: '/logos/magsmen.webp?v=20260414', url: 'https://magsmen.com/', size: 'sm' },
    // Technical
    { name: 'AWS', description: 'Technical partner — Amazon Web Services cloud infrastructure.', tier: 'technical', logo: '/logos/aws.webp', url: 'https://aws.amazon.com', size: 'md' },
    { name: 'Digital Fortress', description: 'Protect your digital world with password-less authentication.', tier: 'technical', logo: '/logos/df.webp', url: 'https://digitalfortress.in/', size: 'md', fix: 'glow' },
    { name: 'LemonPeak', description: 'Technical partner — infrastructure & cloud services.', tier: 'technical', logo: '/logos/lemonpeak.webp', url: 'https://www.lemonpeak.com/', size: 'md' },
    // Gold
    { name: 'Altered Security', description: 'Gold sponsor — advanced red team & AD training.', value: '₹47,000', tier: 'gold', logo: '/logos/altered-security.webp', url: 'https://www.intruderssecurity.com', size: 'md' },
    { name: 'INE', description: 'Gold sponsor — eLearnSecurity & cybersecurity cert training.', value: '~₹28,000', tier: 'gold', logo: '/logos/ine.webp', url: 'https://ine.com', size: 'sm', fix: 'brighten' },
    { name: 'zSecurity', description: 'Gold sponsor — ethical hacking courses & resources.', tier: 'gold', logo: '/logos/zsecurity.webp', url: 'https://zsecurity.org', size: 'md', fix: 'brighten' },
    // Silver
    { name: 'Caido', description: 'Silver sponsor — next-gen web security testing proxy.', value: '₹1,02,000', tier: 'silver', logo: '/logos/caido.webp', url: 'https://caido.io', size: 'md', fix: 'invert' },
    { name: 'Hackviser', description: 'Silver sponsor — cybersecurity advisory & training.', tier: 'silver', logo: '/logos/hackviser.webp', url: 'https://hackviser.com', size: 'sm', fix: 'brighten' },
    { name: 'Hacktronix', description: 'Silver sponsor — hardware hacking tools & education.', tier: 'silver', logo: '/logos/hacktronix.webp', url: 'https://hacktronix.in/', size: 'lg' },
    { name: 'TheXSSRat', description: 'Silver sponsor — bug bounty mentorship & community.', value: '₹3,27,000', tier: 'silver', logo: '/logos/thexssrat.webp', url: 'https://thexssrat.com', size: 'lg' },
    { name: '.xyz Domains', description: 'Silver sponsor — domain registrar for the next generation.', value: '₹35,000', tier: 'silver', logo: '/logos/xyz.webp', url: 'https://gen.xyz', size: 'sm', fix: 'invert' },
    // Community
    { name: 'BSides Vizag', description: 'Community partner — grassroots security conference in Visakhapatnam fostering local infosec culture.', tier: 'community', logo: '/logos/bsides-vizag.webp', url: 'https://bsidesvizag.in', size: 'md' },
    { name: 'HackTheBox Mumbai', description: 'Community partner — local HackTheBox chapter connecting Mumbai-based security enthusiasts.', tier: 'community', logo: '/logos/htb-mumbai.webp', url: 'https://www.hackthebox.com', size: 'md' },
    { name: 'null', description: 'null, the open security community.', tier: 'community', logo: '/logos/null.webp', url: 'https://null.community', size: 'sm' },
    { name: 'OSC', description: 'Open Source Community.', tier: 'community', logo: '/logos/osc.webp', url: 'https://www.instagram.com/osc.vitap/', size: 'sm' },
    { name: 'OSEN', description: 'Community partner — open security education network.', tier: 'community', logo: '/logos/osen.webp', url: 'https://osen.in', size: 'lg' },
    { name: 'OSMSEC', description: 'Silver sponsor — open-source security collective.', tier: 'silver', logo: '/logos/osmsec.webp', url: 'https://osmsec.xyz', size: 'sm' },
];

export const communityPartners = [
    { name: 'HackTheBox Mumbai', logo: '/logos/htb-mumbai.webp', url: 'https://www.hackthebox.com' },
    { name: 'BSides Vizag', logo: '/logos/bsides-vizag.webp', url: 'https://bsidesvizag.in' },
];

/* ── Marquee strings ──────────────────────────────────────────── */
export const marqueeItems = [
    'RECON 2026',
    EVENT_DATE_RANGE_LABEL,
    'VIT-AP UNIVERSITY',
    'HUNT. BREAK. DEFEND.',
    '₹1.5M + PRIZE POOL',
    '3 DAYS',
    '12+ EVENTS',
    '600+ HACKERS',
    'CTF × KOTH × HARDWARE × FORENSICS',
    'REGISTER NOW',
];

/* ── ASCII banner ─────────────────────────────────────────────── */
export const asciiBanner = `
██████╗ ███████╗ ██████╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔════╝██╔═══██╗████╗  ██║
██████╔╝█████╗  ██║     ██║   ██║██╔██╗ ██║
██╔══██╗██╔══╝  ██║     ██║   ██║██║╚██╗██║
██║  ██║███████╗╚██████╗╚██████╔╝██║ ╚████║
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝`.trim();
