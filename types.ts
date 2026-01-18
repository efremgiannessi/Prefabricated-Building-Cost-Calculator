
export enum StructureType {
  BACACIER = 'Bacacier',
  ALARE = 'Alare',
  MONOLITHIC = 'Monolitica',
  FLAT = 'Piana'
}

export enum AlareSubtype {
  SHED = 'Shed',
  CIECO = 'Cieco'
}

export enum MonolithicSubtype {
  SHED = 'Shed',
  CIECO = 'Cieco'
}

export enum BacacierSubtype {
  CIECO = 'Cieco',
  LUCERNARI = 'Lucernari'
}

export enum ThermalOption {
  WARM = 'Caldo',
  COLD = 'Freddo'
}

export enum PanelFinish {
  FONDO_CASSERO = 'Grigio Fondo Cassero',
  MARMI = 'Extra Marmo',
  MINCIO = 'Ghiaietto ex Mincio'
}

export interface BuildingDimensions {
  length: number;
  width: number;
  height: number;
  mezzanineArea: number;
  coveredArea: number;
  foundationArea: number;
  flooringArea: number;
}

export interface BacacierPricing {
  plant: number;
  warmCieco: number;
  coldCieco: number;
  warmLucernari: number;
  coldLucernari: number;
}

export interface StructurePricing {
  plant: number;
  roofWarm: number;
  roofCold: number;
}

export interface MonolithicPricing {
  plant: number;
  warmShed: number;
  warmCieco: number;
  coldShed: number;
  coldCieco: number;
}

export interface AlarePricing {
  plant: number;
  warmShed: number;
  warmCieco: number;
  coldShed: number;
  coldCieco: number;
}

export interface UnitCosts {
  mezzanineCost: number;
  panelCostWarm: number;
  panelCostCold: number;
  foundationUnitCost: number;
  flooringUnitCost: number;
  finishExtras: {
    [PanelFinish.FONDO_CASSERO]: number;
    [PanelFinish.MARMI]: number;
    [PanelFinish.MINCIO]: number;
  };
  bacacier: BacacierPricing;
  monolithic: MonolithicPricing;
  flat: StructurePricing;
  alare: AlarePricing;
}

export interface CalculationResult {
  type: StructureType;
  subtype?: string; // Generic string to handle both Alare and Bacacier subtypes
  thermal: ThermalOption;
  finish: PanelFinish;
  plantArea: number;
  perimeter: number;
  panelArea: number;
  mezzanineArea: number;
  coveredArea: number;
  foundationArea: number;
  flooringArea: number;
  totalCost: number;
  unitCosts: {
    plant: number;
    mezzanine: number;
    roof: number;
    panelBase: number;
    panelExtra: number;
    foundations: number;
    flooring: number;
  };
  breakdown: {
    plant: number;
    mezzanine: number;
    roof: number;
    panelBase: number;
    panelExtra: number;
    foundations: number;
    flooring: number;
  };
}
