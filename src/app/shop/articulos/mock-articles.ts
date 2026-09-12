import { Article } from './articulos.component';

export interface MockFamily {
  codfam: string;
  desfam: string;
  imageUrl?: string;
  sec?: string[];
}

export const MOCK_FAMILIES: MockFamily[] = [
  // Categorías Principales
  { codfam: '01', desfam: 'Agua y Riego Agrícola', imageUrl: 'assets/img/agua.png', sec: ['1', '2', '3', '5', '11', '21', '32'] },
  { codfam: '02', desfam: 'Energía Solar y Bombeo', imageUrl: 'assets/img/energia.png', sec: ['REN'] },
  { codfam: '03', desfam: 'Ferretería y Tuberías', imageUrl: 'assets/img/jardineria.png', sec: ['31', '10', '18', '9', '36'] },
  { codfam: '04', desfam: 'Seguridad y Vigilancia Homologada', imageUrl: 'assets/img/seguridad.png', sec: ['SEG'] },
  { codfam: '05', desfam: 'Telecomunicaciones Rurales y Redes', imageUrl: 'assets/img/seguridad.png', sec: ['SEG'] },
  { codfam: '06', desfam: 'Electricidad y Motores Industriales', imageUrl: 'assets/img/motores.png', sec: ['30', 'ELC'] },

  // Subfamilias detalladas por sección para navegación precisa
  { codfam: '01', desfam: 'Tuberías y Riego por Goteo', imageUrl: 'assets/img/agua.png', sec: ['1', '2'] },
  { codfam: '01', desfam: 'Bombas Sumergibles y Pozos', imageUrl: 'assets/img/agua.png', sec: ['3', '5'] },
  { codfam: '01', desfam: 'Electroválvulas y Automatismos', imageUrl: 'assets/img/agua.png', sec: ['11', '21'] },
  { codfam: '01', desfam: 'Aspersores y Difusores de Impacto', imageUrl: 'assets/img/agua.png', sec: ['32'] },
  { codfam: '02', desfam: 'Paneles Solares Fotovoltaicos', imageUrl: 'assets/img/energia.png', sec: ['REN'] },
  { codfam: '02', desfam: 'Inversores de Bombeo Solar Directo', imageUrl: 'assets/img/energia.png', sec: ['REN'] },
  { codfam: '02', desfam: 'Estructuras y Soportes para Paneles', imageUrl: 'assets/img/energia.png', sec: ['REN'] },
  { codfam: '06', desfam: 'Motobombas Diésel y Gasolina', imageUrl: 'assets/img/motores.png', sec: ['30'] },
  { codfam: '06', desfam: 'Motores Eléctricos Sumergibles', imageUrl: 'assets/img/motores.png', sec: ['30'] },
  { codfam: '03', desfam: 'Ferretería Industrial y Fijaciones', imageUrl: 'assets/img/jardineria.png', sec: ['31', '10'] },
  { codfam: '03', desfam: 'Mangueras y Accesorios de Jardín', imageUrl: 'assets/img/jardineria.png', sec: ['18'] },
  { codfam: '03', desfam: 'Climatización y Tuberías Multicapa', imageUrl: 'assets/img/climatizacion.png', sec: ['9', '36'] },
  { codfam: '06', desfam: 'Cuadros Eléctricos y Automatización', imageUrl: 'assets/img/electronica.png', sec: ['ELC'] },
  { codfam: '01', desfam: 'Outlet: Liquidación Riego y Tuberías', imageUrl: 'assets/img/outlet.png', sec: ['OFE'] },
  { codfam: '02', desfam: 'Outlet: Paneles y Bombeo Solar', imageUrl: 'assets/img/outlet.png', sec: ['OFE'] }
];

export const MOCK_ARTICLES: Article[] = [
  // ─── AGUA Y RIEGO AGRÍCOLA (01) ──────────────────────
  {
    codart: '00101',
    desart: 'Bomba Sumergible Solar Lorentz PS2-1800',
    dewart: 'Bomba Sumergible Solar Lorentz PS2-1800',
    pcoart: '845.00',
    imgart: 'assets/img/agua.png',
    famart: '01',
    eanart: '8435123400101',
    measure: '1.8 kW (Acero Inox)',
    tivart: '0',
    netPrice: '698.35',
    vatAmount: '146.65'
  },
  {
    codart: '00102',
    desart: 'Bomba Superficie Centrífuga Pedrollo 1.5 CV',
    dewart: 'Bomba Superficie Centrífuga Pedrollo 1.5 CV',
    pcoart: '320.00',
    imgart: 'assets/img/motores.png',
    famart: '01',
    eanart: '8435123400102',
    measure: '1.5 CV (230V Monofásica)',
    tivart: '0',
    netPrice: '264.46',
    vatAmount: '55.54'
  },
  {
    codart: '00103',
    desart: 'Electroválvula Riego Hunter PGV 24V 1',
 dewart: 'Electroválvula Riego Hunter PGV 24V 1',
    pcoart: '24.90',
    imgart: 'assets/img/agua.png',
    famart: '01',
    eanart: '8435123400103',
    measure: '1 Rosca Hembra',
 tivart: '0',
 netPrice: '20.58',
 vatAmount: '4.32'
 },
 {
 codart: '00104',
 desart: 'Aspersor Agrícola de Impacto Latón 3/4',
    dewart: 'Aspersor Agrícola de Impacto Latón 3/4',
 pcoart: '18.50',
 imgart: 'assets/img/agua.png',
 famart: '01',
 eanart: '8435123400104',
 measure: 'Sectorial 3/4 (Alcance 18m)',
    tivart: '0',
    netPrice: '15.29',
    vatAmount: '3.21'
  },
  {
    codart: '00105',
    desart: 'Programador de Riego Bluetooth Solem 4 Estaciones',
    dewart: 'Programador de Riego Bluetooth Solem 4 Estaciones',
    pcoart: '125.00',
    imgart: 'assets/img/agua.png',
    famart: '01',
    eanart: '8435123400105',
    measure: '4 Estaciones (Pilas 9V)',
    tivart: '0',
    netPrice: '103.31',
    vatAmount: '21.69'
  },

  // ─── ENERGÍA SOLAR Y BOMBEO (02) ─────────────────────
  {
    codart: '00201',
    desart: 'Panel Solar Monocristalino Tier 1 550W Half-Cut',
    dewart: 'Panel Solar Monocristalino Tier 1 550W Half-Cut',
    pcoart: '115.00',
    imgart: 'assets/img/energia.png',
    famart: '02',
    eanart: '8435123400201',
    measure: '550W (144 Células)',
    tivart: '0',
    netPrice: '95.04',
    vatAmount: '19.96'
  },
  {
    codart: '00202',
    desart: 'Variador Bombeo Solar INVT BPD 4kW Trifásico',
    dewart: 'Variador Bombeo Solar INVT BPD 4kW Trifásico',
    pcoart: '650.00',
    imgart: 'assets/img/energia.png',
    famart: '02',
    eanart: '8435123400202',
    measure: '4.0 kW (Entrada MPPT)',
    tivart: '0',
    netPrice: '537.19',
    vatAmount: '112.81'
  },
  {
    codart: '00203',
    desart: 'Estructura Coplanar Aluminio 4 Módulos Fotovoltaicos',
    dewart: 'Estructura Coplanar Aluminio 4 Módulos Fotovoltaicos',
    pcoart: '185.00',
    imgart: 'assets/img/energia.png',
    famart: '02',
    eanart: '8435123400203',
    measure: 'Kit 4 Paneles (Tornillería A2)',
    tivart: '0',
    netPrice: '152.89',
    vatAmount: '32.11'
  },
  {
    codart: '00204',
    desart: 'Cable Solar H1Z2Z2-K 6mm² Bobina 100m Negro',
    dewart: 'Cable Solar H1Z2Z2-K 6mm² Bobina 100m Negro',
    pcoart: '92.00',
    imgart: 'assets/img/energia.png',
    famart: '02',
    eanart: '8435123400204',
    measure: '6mm² (Bobina 100 metros)',
    tivart: '0',
    netPrice: '76.03',
    vatAmount: '15.97'
  },

  // ─── FERRETERÍA Y TUBERÍAS (03) ──────────────────────
  {
    codart: '00301',
    desart: 'Tubería Polietileno Agrícola PE40 50mm 6 Bar',
    dewart: 'Tubería Polietileno Agrícola PE40 50mm 6 Bar',
    pcoart: '78.50',
    imgart: 'assets/img/jardineria.png',
    famart: '03',
    eanart: '8435123400301',
    measure: '50mm (Rollo 100m)',
    tivart: '0',
    netPrice: '64.88',
    vatAmount: '13.62'
  },
  {
    codart: '00302',
    desart: 'Válvula de Esfera Latón Paso Total PN25 2',
 dewart: 'Válvula de Esfera Latón Paso Total PN25 2',
    pcoart: '28.50',
    imgart: 'assets/img/jardineria.png',
    famart: '03',
    eanart: '8435123400302',
    measure: '2 Rosca Hembra',
 tivart: '0',
 netPrice: '23.55',
 vatAmount: '4.95'
 },
 {
 codart: '00303',
 desart: 'Filtro de Anillas Manual 2 130 Micras',
    dewart: 'Filtro de Anillas Manual 2 130 Micras',
 pcoart: '45.00',
 imgart: 'assets/img/jardineria.png',
 famart: '03',
 eanart: '8435123400303',
 measure: '2 (Caudal 30 m³/h)',
    tivart: '0',
    netPrice: '37.19',
    vatAmount: '7.81'
  },
  {
    codart: '00304',
    desart: 'Gotero Autocompensante 4 l/h Bolsa 100 uds',
    dewart: 'Gotero Autocompensante 4 l/h Bolsa 100 uds',
    pcoart: '22.00',
    imgart: 'assets/img/jardineria.png',
    famart: '03',
    eanart: '8435123400304',
    measure: '4 l/h (Pack 100 uds)',
    tivart: '0',
    netPrice: '18.18',
    vatAmount: '3.82'
  },

  // ─── SEGURIDAD Y ALARMAS (04) ────────────────────────
  {
    codart: '00401',
    desart: 'Kit Alarma Grado 2 Ajax Hub 2 Plus 4G Sin Cuotas',
    dewart: 'Kit Alarma Grado 2 Ajax Hub 2 Plus 4G Sin Cuotas',
    pcoart: '420.00',
    imgart: 'assets/img/seguridad.png',
    famart: '04',
    eanart: '8435123400401',
    measure: 'Kit Central + 2 Detectores + Mando',
    tivart: '0',
    netPrice: '347.11',
    vatAmount: '72.89'
  },
  {
    codart: '00402',
    desart: 'Cámara IP Domo Exterior Hikvision 4K 8MP ColorVu',
    dewart: 'Cámara IP Domo Exterior Hikvision 4K 8MP ColorVu',
    pcoart: '145.00',
    imgart: 'assets/img/seguridad.png',
    famart: '04',
    eanart: '8435123400402',
    measure: '4K UltraHD (ColorVu 24/7)',
    tivart: '0',
    netPrice: '119.83',
    vatAmount: '25.17'
  },
  {
    codart: '00403',
    desart: 'Grabador NVR 8 Canales 4K PoE con Disco 2TB',
    dewart: 'Grabador NVR 8 Canales 4K PoE con Disco 2TB',
    pcoart: '285.00',
    imgart: 'assets/img/seguridad.png',
    famart: '04',
    eanart: '8435123400403',
    measure: '8 Canales PoE (HDD 2TB incluido)',
    tivart: '0',
    netPrice: '235.54',
    vatAmount: '49.46'
  },
  {
    codart: '00404',
    desart: 'Cámara Térmica Bi-espectro Perimetral Fincas',
    dewart: 'Cámara Térmica Bi-espectro Perimetral Fincas',
    pcoart: '580.00',
    imgart: 'assets/img/seguridad.png',
    famart: '04',
    eanart: '8435123400404',
    measure: 'Térmica + Óptica (Alcance 120m)',
    tivart: '0',
    netPrice: '479.34',
    vatAmount: '100.66'
  },

  // ─── TELECOMUNICACIONES RURALES (05) ─────────────────
  {
    codart: '00501',
    desart: 'Enlace Punto a Punto Ubiquiti LiteBeam 5AC Gen2',
    dewart: 'Enlace Punto a Punto Ubiquiti LiteBeam 5AC Gen2',
    pcoart: '89.00',
    imgart: 'assets/img/electronica.png',
    famart: '05',
    eanart: '8435123400501',
    measure: '23 dBi (Hasta 30 km 450Mbps)',
    tivart: '0',
    netPrice: '73.55',
    vatAmount: '15.45'
  },
  {
    codart: '00502',
    desart: 'Antena Parabólica Ubiquiti RocketDish 30 dBi',
    dewart: 'Antena Parabólica Ubiquiti RocketDish 30 dBi',
    pcoart: '195.00',
    imgart: 'assets/img/electronica.png',
    famart: '05',
    eanart: '8435123400502',
    measure: '30 dBi (Largo alcance 50 km)',
    tivart: '0',
    netPrice: '161.16',
    vatAmount: '33.84'
  },
  {
    codart: '00503',
    desart: 'Router 4G/5G Industrial Dual SIM Exterior Carril DIN',
    dewart: 'Router 4G/5G Industrial Dual SIM Exterior Carril DIN',
    pcoart: '210.00',
    imgart: 'assets/img/electronica.png',
    famart: '05',
    eanart: '8435123400503',
    measure: 'Dual SIM 4G/5G + WiFi 6',
    tivart: '0',
    netPrice: '173.55',
    vatAmount: '36.45'
  },
  {
    codart: '00504',
    desart: 'Bobina Cable UTP Cat6 Exterior Doble Cubierta PE 305m',
    dewart: 'Bobina Cable UTP Cat6 Exterior Doble Cubierta PE 305m',
    pcoart: '135.00',
    imgart: 'assets/img/electronica.png',
    famart: '05',
    eanart: '8435123400504',
    measure: 'Cat6 PE (Bobina 305 metros)',
    tivart: '0',
    netPrice: '111.57',
    vatAmount: '23.43'
  },

  // ─── ELECTRICIDAD Y MOTORES (06) ─────────────────────
  {
    codart: '00601',
    desart: 'Cuadro Eléctrico Estanco Protección Fotovoltaica DC/AC',
    dewart: 'Cuadro Eléctrico Estanco Protección Fotovoltaica DC/AC',
    pcoart: '165.00',
    imgart: 'assets/img/climatizacion.png',
    famart: '06',
    eanart: '8435123400601',
    measure: 'Protección Sobretensiones + Térmicos',
    tivart: '0',
    netPrice: '136.36',
    vatAmount: '28.64'
  },
  {
    codart: '00602',
    desart: 'Motor Eléctrico Trifásico 3 CV 1500 RPM B3',
    dewart: 'Motor Eléctrico Trifásico 3 CV 1500 RPM B3',
    pcoart: '240.00',
    imgart: 'assets/img/motores.png',
    famart: '06',
    eanart: '8435123400602',
    measure: '3 CV (Trifásico 230/400V)',
    tivart: '0',
    netPrice: '198.35',
    vatAmount: '41.65'
  },
  {
    codart: '00603',
    desart: 'Generador Eléctrico Gasolina Inverter 3.5 kW',
    dewart: 'Generador Eléctrico Gasolina Inverter 3.5 kW',
    pcoart: '490.00',
    imgart: 'assets/img/motores.png',
    famart: '06',
    eanart: '8435123400603',
    measure: '3.5 kW (Arranque Eléctrico)',
    tivart: '0',
    netPrice: '404.96',
    vatAmount: '85.04'
  }
];
