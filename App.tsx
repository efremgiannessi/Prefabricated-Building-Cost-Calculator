import React, { useState, useMemo } from 'react';
import { 
  BuildingDimensions, 
  UnitCosts, 
  StructureType, 
  ThermalOption, 
  CalculationResult,
  AlareSubtype,
  MonolithicSubtype,
  BacacierSubtype,
  PanelFinish
} from './types';
import { 
  Building2, 
  Ruler, 
  Zap, 
  Layers,
  FileText,
  Printer,
  ChevronRight,
  Settings2,
  Box,
  LayoutGrid,
  TrendingUp,
  CreditCard,
  Hexagon,
  MousePointer2
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  // Defaulting strictly to the "Industrial Dark" theme logic
  const [dimensions, setDimensions] = useState<BuildingDimensions>({
    length: 50,
    width: 30,
    height: 8,
    mezzanineArea: 200,
    coveredArea: 1500,
    foundationArea: 1500,
    flooringArea: 1500,
  });

  const [costs, setCosts] = useState<UnitCosts>({
    mezzanineCost: 120,
    panelCostWarm: 124,
    panelCostCold: 100,
    foundationUnitCost: 65,
    flooringUnitCost: 45,
    finishExtras: {
      [PanelFinish.FONDO_CASSERO]: 0,
      [PanelFinish.MARMI]: 14,
      [PanelFinish.MINCIO]: 10
    },
    bacacier: { 
      plant: 45, 
      warmCieco: 100, 
      coldCieco: 80, 
      warmLucernari: 120, 
      coldLucernari: 100  
    },
    monolithic: { 
      plant: 75, 
      warmCieco: 75, 
      coldCieco: 55,
      warmShed: 85,
      coldShed: 65
    },
    flat: { plant: 90, roofWarm: 70, roofCold: 50 },
    alare: { 
      plant: 55, 
      warmShed: 100, 
      warmCieco: 85, 
      coldShed: 90, 
      coldCieco: 70 
    }
  });

  const [individualMultipliers, setIndividualMultipliers] = useState<Record<string, number>>({});
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(100);
  const [includeComplementary, setIncludeComplementary] = useState<boolean>(false);

  const [selectedType, setSelectedType] = useState<StructureType>(StructureType.BACACIER);
  const [selectedFinish, setSelectedFinish] = useState<PanelFinish>(PanelFinish.FONDO_CASSERO);

  // --- Logic ---
  const calculateResults = useMemo((): CalculationResult[] => {
    const types = [
      StructureType.BACACIER,
      StructureType.ALARE,
      StructureType.MONOLITHIC,
      StructureType.FLAT
    ];
    const thermals = [ThermalOption.WARM, ThermalOption.COLD];

    const results: CalculationResult[] = [];
    const plantArea = dimensions.length * dimensions.width;
    const perimeter = 2 * (dimensions.length + dimensions.width);

    types.forEach(type => {
      thermals.forEach(thermal => {
        let heightOffset = 2;
        if (type === StructureType.MONOLITHIC) heightOffset = 3;
        if (type === StructureType.FLAT) heightOffset = 1;

        const panelArea = perimeter * (dimensions.height + heightOffset);
        
        let basePlantUnitCost = 0;
        let baseRoofUnitCost = 0;

        if (type === StructureType.MONOLITHIC) {
          basePlantUnitCost = costs.monolithic.plant;
        } else if (type === StructureType.ALARE) {
          basePlantUnitCost = costs.alare.plant;
        } else if (type === StructureType.FLAT) {
          basePlantUnitCost = costs.flat.plant;
          baseRoofUnitCost = thermal === ThermalOption.WARM ? costs.flat.roofWarm : costs.flat.roofCold;
        } else if (type === StructureType.BACACIER) {
          basePlantUnitCost = costs.bacacier.plant;
        }

        const basePanelUnitCost = thermal === ThermalOption.WARM ? costs.panelCostWarm : costs.panelCostCold;
        const baseFinishExtra = costs.finishExtras[selectedFinish];

        const addResult = (finalRoofBaseCost: number, subtype?: string) => {
          const key = `${type}_${thermal}_${subtype || 'NONE'}`;
          
          const currentMult = (globalMultiplier / 100) * ((individualMultipliers[key] || 100) / 100);

          const unitPlant = basePlantUnitCost * currentMult;
          const unitMezzanine = costs.mezzanineCost * currentMult;
          const unitRoof = finalRoofBaseCost * currentMult;
          const unitFoundations = costs.foundationUnitCost * currentMult;
          const unitFlooring = costs.flooringUnitCost * currentMult;
          
          const unitPanelBase = basePanelUnitCost;
          const unitPanelExtra = baseFinishExtra;

          const plantCost = plantArea * unitPlant;
          const mezzanineCost = dimensions.mezzanineArea * unitMezzanine;
          const roofCost = dimensions.coveredArea * unitRoof;
          
          const foundationCost = includeComplementary ? dimensions.foundationArea * unitFoundations : 0;
          const flooringCost = includeComplementary ? dimensions.flooringArea * unitFlooring : 0;
          
          const panelBaseCost = panelArea * unitPanelBase;
          const panelExtraCost = panelArea * unitPanelExtra;

          const totalCost = plantCost + mezzanineCost + roofCost + foundationCost + flooringCost + panelBaseCost + panelExtraCost;

          results.push({
            type,
            subtype,
            thermal,
            finish: selectedFinish,
            plantArea,
            perimeter,
            panelArea,
            mezzanineArea: dimensions.mezzanineArea,
            coveredArea: dimensions.coveredArea,
            foundationArea: dimensions.foundationArea,
            flooringArea: dimensions.flooringArea,
            totalCost,
            unitCosts: {
              plant: unitPlant,
              mezzanine: unitMezzanine,
              roof: unitRoof,
              panelBase: unitPanelBase,
              panelExtra: unitPanelExtra,
              foundations: unitFoundations,
              flooring: unitFlooring
            },
            breakdown: {
              plant: plantCost,
              mezzanine: mezzanineCost,
              roof: roofCost,
              panelBase: panelBaseCost,
              panelExtra: panelExtraCost,
              foundations: foundationCost,
              flooring: flooringCost
            }
          });
        };

        if (type === StructureType.ALARE) {
          const shedCost = thermal === ThermalOption.WARM ? costs.alare.warmShed : costs.alare.coldShed;
          const ciecoCost = thermal === ThermalOption.WARM ? costs.alare.warmCieco : costs.alare.coldCieco;
          addResult(shedCost, AlareSubtype.SHED);
          addResult(ciecoCost, AlareSubtype.CIECO);
        } else if (type === StructureType.MONOLITHIC) {
          const shedCost = thermal === ThermalOption.WARM ? costs.monolithic.warmShed : costs.monolithic.coldShed;
          const ciecoCost = thermal === ThermalOption.WARM ? costs.monolithic.warmCieco : costs.monolithic.coldCieco;
          addResult(shedCost, MonolithicSubtype.SHED);
          addResult(ciecoCost, MonolithicSubtype.CIECO);
        } else if (type === StructureType.BACACIER) {
          const ciecoCost = thermal === ThermalOption.WARM ? costs.bacacier.warmCieco : costs.bacacier.coldCieco;
          const lucernariCost = thermal === ThermalOption.WARM ? costs.bacacier.warmLucernari : costs.bacacier.coldLucernari;
          addResult(ciecoCost, BacacierSubtype.CIECO);
          addResult(lucernariCost, BacacierSubtype.LUCERNARI);
        } else {
          addResult(baseRoofUnitCost);
        }
      });
    });

    return results;
  }, [dimensions, costs, selectedFinish, individualMultipliers, includeComplementary, globalMultiplier]);

  const filteredResults = useMemo(() => {
    return calculateResults.filter(r => r.type === selectedType);
  }, [calculateResults, selectedType]);

  // --- Handlers ---
  const handleDimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleNestedCostChange = (typeKey: keyof UnitCosts, subKey: string, value: string) => {
    const num = parseFloat(value) || 0;
    setCosts(prev => ({
      ...prev,
      [typeKey]: {
        ...(prev[typeKey] as any),
        [subKey]: num
      }
    }));
  };

  const updateIndividualMultiplier = (type: StructureType, thermal: ThermalOption, subtype: string | undefined, value: number) => {
    const key = `${type}_${thermal}_${subtype || 'NONE'}`;
    setIndividualMultipliers(prev => ({ ...prev, [key]: value }));
  };

  const generateReportHtml = (resultsToPrint: CalculationResult[], titleSuffix: string) => {
    const timestamp = new Date().toLocaleString('it-IT');
    
    const cardHtml = resultsToPrint.map(res => {
      const key = `${res.type}_${res.thermal}_${res.subtype || 'NONE'}`;
      const multiplier = (globalMultiplier / 100) * ((individualMultipliers[key] || 100) / 100) * 100;
      const accentColor = res.thermal === ThermalOption.WARM ? '#ea580c' : '#0ea5e9'; // Orange vs Sky Blue
      
      return `
      <div class="card" style="border-left: 5px solid ${accentColor};">
        <div class="card-body">
          <div class="header">
            <div>
              <div class="title">${res.type} ${res.subtype ? '- ' + res.subtype : ''}</div>
              <div class="thermal-label" style="color: ${accentColor}">OPZIONE ${res.thermal}</div>
            </div>
            <div class="price-container">
              <div class="total-price">€${Math.round(res.totalCost).toLocaleString('it-IT')}</div>
              <div class="unit-price">€${(res.totalCost / res.plantArea).toFixed(2)}/m²</div>
            </div>
          </div>

          <div class="multiplier-info">
             VARIAZIONE COMBINATA: <strong>${Math.round(multiplier)}%</strong>
          </div>

          <div class="breakdown">
            <div class="breakdown-header">
              <span>Componente</span>
              <span class="text-right">€/m²</span>
              <span class="text-right">TOTALE</span>
            </div>
            <div class="breakdown-row">
              <span>Struttura</span>
              <span class="text-right">${res.unitCosts.plant.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.plant).toLocaleString()}</span>
            </div>
            ${res.breakdown.foundations > 0 ? `
            <div class="breakdown-row">
              <span>Fondazioni</span>
              <span class="text-right">${res.unitCosts.foundations.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.foundations).toLocaleString()}</span>
            </div>` : ''}
            ${res.breakdown.flooring > 0 ? `
            <div class="breakdown-row">
              <span>Pavimentazione</span>
              <span class="text-right">${res.unitCosts.flooring.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.flooring).toLocaleString()}</span>
            </div>` : ''}
            <div class="breakdown-row">
              <span>Soppalchi</span>
              <span class="text-right">${res.unitCosts.mezzanine.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.mezzanine).toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Copertura</span>
              <span class="text-right">${res.unitCosts.roof.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.roof).toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Pannelli Base</span>
              <span class="text-right">${res.unitCosts.panelBase.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.panelBase).toLocaleString()}</span>
            </div>
            <div class="breakdown-row highlight">
              <span>Finitura (${res.finish})</span>
              <span class="text-right">${res.unitCosts.panelExtra.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.panelExtra).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Report - ${titleSuffix}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; background-color: #ffffff; color: #111827; margin: 0; }
        .report-header { margin-bottom: 30px; border-bottom: 4px solid #111827; padding-bottom: 20px; }
        .report-header h1 { margin: 0; font-size: 24px; color: #111827; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }
        .report-header p { margin: 5px 0 0 0; font-size: 12px; font-family: 'JetBrains Mono', monospace; opacity: 0.8; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .card { background: #f3f4f6; border: 1px solid #e5e7eb; break-inside: avoid; margin-bottom: 20px;}
        .card-body { padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #111827; }
        .thermal-label { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.1em; }
        .price-container { text-align: right; }
        .total-price { font-size: 24px; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: #111827; }
        .unit-price { font-size: 12px; font-weight: 700; color: #6b7280; font-family: 'JetBrains Mono', monospace; }
        .multiplier-info { background: #e5e7eb; padding: 8px; font-size: 10px; margin-bottom: 15px; color: #374151; font-weight: 600; text-transform: uppercase; }
        .breakdown-header { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #9ca3af; border-bottom: 2px solid #d1d5db; padding-bottom: 6px; margin-bottom: 6px; letter-spacing: 0.1em; }
        .breakdown-row { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 11px; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-family: 'JetBrains Mono', monospace; }
        .breakdown-row span:first-child { font-family: 'Inter', sans-serif; font-weight: 600; text-transform: uppercase; font-size: 10px; }
        .breakdown-row.highlight { color: #ea580c; font-weight: 700; }
        .text-right { text-align: right; }
        
        .report-footer { margin-top: 50px; padding: 20px; border-top: 2px solid #111827; text-align: center; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; opacity: 0.6; }

        @media print { 
          body { -webkit-print-color-adjust: exact; }
          .grid { display: block; }
          .card { width: 100%; margin-bottom: 15px; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${titleSuffix}</h1>
        <p>DIM: ${dimensions.length}x${dimensions.width}m | H: ${dimensions.height}m | AREA: ${dimensions.length * dimensions.width}m²</p>
        <p>DATE: ${timestamp} | FINISH: ${selectedFinish}</p>
      </div>
      <div class="grid">
        ${cardHtml}
      </div>
      <div class="report-footer">
        GENERATED BY EFREM GIANNESSI ENGINEERING SOLUTIONS
      </div>
    </body>
    </html>`;
  };

  const exportSelected = () => {
    const html = generateReportHtml(filteredResults, `ANALYSIS: ${selectedType}`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${selectedType.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const html = generateReportHtml(calculateResults, `FULL REPORT: ALL TYPES`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_complete.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const html = generateReportHtml(calculateResults, `PRINT EXPORT`);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#111827] text-gray-100">
      
      {/* Sidebar - Dark Industrial Style */}
      <aside className="w-full lg:w-96 border-r border-gray-800 lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto custom-scrollbar bg-[#0a0f1d]">
        <div className="p-8 border-b border-gray-800/50 bg-[#070b14]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600 rounded-xl shadow-lg shadow-orange-600/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none uppercase tracking-tighter mb-1">Precast Estimator</h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold">Industrial v2.0</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-10 pb-20">
          
          {/* GEOMETRY SECTION */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              <Ruler className="w-3 h-3" /> Building Geometry
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Length (m)" name="length" value={dimensions.length} onChange={handleDimChange} />
              <InputField label="Width (m)" name="width" value={dimensions.width} onChange={handleDimChange} />
              <InputField label="Height (m)" name="height" value={dimensions.height} onChange={handleDimChange} />
              <InputField label="Mezzanine (m²)" name="mezzanineArea" value={dimensions.mezzanineArea} onChange={handleDimChange} />
              <InputField label="Covered (m²)" name="coveredArea" value={dimensions.coveredArea} onChange={handleDimChange} className="col-span-2" />
            </div>
          </section>

          {/* GLOBAL VARIANCE */}
          <section className="p-5 rounded-3xl border border-gray-800 bg-[#0c1120] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <Zap className="w-3 h-3 text-orange-500" /> Global Rate Adj.
              </div>
              <div className={`text-base font-black font-mono tracking-tighter ${globalMultiplier !== 100 ? 'text-orange-500' : 'text-gray-500'}`}>
                {globalMultiplier}%
              </div>
            </div>
            <input 
              type="range" 
              min="50" 
              max="200" 
              value={globalMultiplier} 
              onChange={(e) => setGlobalMultiplier(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-orange-600 hover:accent-orange-500 transition-all"
            />
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[8px] font-black text-gray-700 tracking-wider">-50%</span>
              <span className="text-[8px] font-black text-gray-700 tracking-wider">BASE</span>
              <span className="text-[8px] font-black text-gray-700 tracking-wider">+100%</span>
            </div>
          </section>

          {/* PANEL COSTS */}
          <section>
             <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              <Box className="w-3 h-3" /> Base Panel Costs
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Warm Panel €/m²" 
                value={costs.panelCostWarm} 
                onChange={(e) => setCosts(prev => ({ ...prev, panelCostWarm: parseFloat(e.target.value) || 0 }))} 
              />
              <InputField 
                label="Cold Panel €/m²" 
                value={costs.panelCostCold} 
                onChange={(e) => setCosts(prev => ({ ...prev, panelCostCold: parseFloat(e.target.value) || 0 }))} 
              />
            </div>
          </section>

          {/* COMPLEMENTARY WORKS */}
          <section className="p-5 rounded-3xl border border-gray-800 bg-[#0c1120]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <LayoutGrid className="w-3 h-3 text-orange-500" /> Site Works
              </div>
              <div 
                onClick={() => setIncludeComplementary(!includeComplementary)}
                className={`w-10 h-5 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${includeComplementary ? 'bg-orange-600' : 'bg-gray-700'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${includeComplementary ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Found. Area" value={dimensions.foundationArea} onChange={(e) => setDimensions(d => ({...d, foundationArea: parseFloat(e.target.value) || 0}))} />
                <InputField label="Found. €/m²" value={costs.foundationUnitCost} onChange={(e) => setCosts(c => ({...c, foundationUnitCost: parseFloat(e.target.value) || 0}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Floor Area" value={dimensions.flooringArea} onChange={(e) => setDimensions(d => ({...d, flooringArea: parseFloat(e.target.value) || 0}))} />
                <InputField label="Floor €/m²" value={costs.flooringUnitCost} onChange={(e) => setCosts(c => ({...c, flooringUnitCost: parseFloat(e.target.value) || 0}))} />
              </div>
            </div>
          </section>

          {/* FINISH SELECTION */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              <Hexagon className="w-3 h-3" /> Exterior Finish
            </div>
            <div className="space-y-2">
              {Object.values(PanelFinish).map((finish) => (
                <button
                  key={finish}
                  onClick={() => setSelectedFinish(finish)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 group ${
                    selectedFinish === finish 
                    ? 'bg-orange-600/10 border-orange-600 text-orange-500' 
                    : 'bg-[#111827] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${selectedFinish === finish ? 'bg-orange-500' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
                     {finish}
                  </span>
                  <span className="bg-[#0a0f1d] text-gray-500 px-2 py-1 rounded font-mono">
                    +{costs.finishExtras[finish]} €
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ADVANCED CONFIGURATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              <Settings2 className="w-3 h-3" /> Unit Rates (€/m²)
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {/* Bacacier */}
              <ConfigCard title="Bacacier">
                <InputField label="Structure" value={costs.bacacier.plant} onChange={(e) => handleNestedCostChange('bacacier', 'plant', e.target.value)} />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                  <InputField label="Warm Blind" value={costs.bacacier.warmCieco} onChange={(e) => handleNestedCostChange('bacacier', 'warmCieco', e.target.value)} />
                  <InputField label="Cold Blind" value={costs.bacacier.coldCieco} onChange={(e) => handleNestedCostChange('bacacier', 'coldCieco', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                  <InputField label="Warm Skylight" value={costs.bacacier.warmLucernari} onChange={(e) => handleNestedCostChange('bacacier', 'warmLucernari', e.target.value)} />
                  <InputField label="Cold Skylight" value={costs.bacacier.coldLucernari} onChange={(e) => handleNestedCostChange('bacacier', 'coldLucernari', e.target.value)} />
                </div>
              </ConfigCard>

              {/* Monolithic */}
              <ConfigCard title="Monolithic">
                <InputField label="Structure" value={costs.monolithic.plant} onChange={(e) => handleNestedCostChange('monolithic', 'plant', e.target.value)} />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                  <InputField label="Warm Blind" value={costs.monolithic.warmCieco} onChange={(e) => handleNestedCostChange('monolithic', 'warmCieco', e.target.value)} />
                  <InputField label="Cold Blind" value={costs.monolithic.coldCieco} onChange={(e) => handleNestedCostChange('monolithic', 'coldCieco', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                   <InputField label="Warm Shed" value={costs.monolithic.warmShed} onChange={(e) => handleNestedCostChange('monolithic', 'warmShed', e.target.value)} />
                   <InputField label="Cold Shed" value={costs.monolithic.coldShed} onChange={(e) => handleNestedCostChange('monolithic', 'coldShed', e.target.value)} />
                </div>
              </ConfigCard>

              {/* Alare */}
              <ConfigCard title="Alare">
                <InputField label="Structure" value={costs.alare.plant} onChange={(e) => handleNestedCostChange('alare', 'plant', e.target.value)} />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                  <InputField label="Warm Shed" value={costs.alare.warmShed} onChange={(e) => handleNestedCostChange('alare', 'warmShed', e.target.value)} />
                  <InputField label="Warm Blind" value={costs.alare.warmCieco} onChange={(e) => handleNestedCostChange('alare', 'warmCieco', e.target.value)} />
                  <InputField label="Cold Shed" value={costs.alare.coldShed} onChange={(e) => handleNestedCostChange('alare', 'coldShed', e.target.value)} />
                  <InputField label="Cold Blind" value={costs.alare.coldCieco} onChange={(e) => handleNestedCostChange('alare', 'coldCieco', e.target.value)} />
                </div>
              </ConfigCard>

              {/* Flat */}
              <ConfigCard title="Flat">
                <InputField label="Structure" value={costs.flat.plant} onChange={(e) => handleNestedCostChange('flat', 'plant', e.target.value)} />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/50">
                  <InputField label="Warm Roof" value={costs.flat.roofWarm} onChange={(e) => handleNestedCostChange('flat', 'roofWarm', e.target.value)} />
                  <InputField label="Cold Roof" value={costs.flat.roofCold} onChange={(e) => handleNestedCostChange('flat', 'roofCold', e.target.value)} />
                </div>
              </ConfigCard>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-gray-800">
            <button onClick={printPdf} className="w-full flex items-center justify-center gap-3 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportSelected} className="flex items-center justify-center gap-2 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-900/50">
                <FileText className="w-4 h-4" /> Report Type
              </button>
              <button onClick={exportAll} className="flex items-center justify-center gap-2 py-4 bg-[#0a0f1d] border border-gray-700 hover:border-gray-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <Layers className="w-4 h-4" /> Report Full
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-800 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">System Active</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">Cost Analysis</h2>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <span>PROJECT_ID: 24-BETA</span>
                <span className="text-gray-700">|</span>
                <span>FINISH_TYPE: <span className="text-orange-500">{selectedFinish}</span></span>
              </div>
            </div>
            
            <div className="flex p-1.5 rounded-2xl bg-[#0a0f1d] border border-gray-800">
              {Object.values(StructureType).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedType === type 
                    ? 'bg-gray-800 text-white shadow-lg border border-gray-700' 
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8 mb-12">
            {filteredResults.map((res, idx) => {
              const key = `${res.type}_${res.thermal}_${res.subtype || 'NONE'}`;
              const indMult = individualMultipliers[key] || 100;
              const totalMult = Math.round((globalMultiplier / 100) * (indMult / 100) * 100);
              const isWarm = res.thermal === ThermalOption.WARM;

              return (
                <div key={idx} className="group relative bg-gray-800/30 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 shadow-2xl">
                  {/* Status Indicator Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${isWarm ? 'bg-orange-500' : 'bg-sky-500'}`} />
                  
                  <div className="p-8">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border mb-3 ${isWarm ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-sky-500/10 border-sky-500/20 text-sky-500'}`}>
                          <span className="text-[9px] font-black uppercase tracking-widest">{res.thermal} OPTION</span>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                          {res.type} 
                          {res.subtype && <span className="text-gray-600 font-bold text-lg">// {res.subtype}</span>}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-white font-mono tracking-tighter mb-1">
                          €{Math.round(res.totalCost).toLocaleString('it-IT')}
                        </div>
                        <div className="text-xs font-bold font-mono text-gray-500">
                          €{(res.totalCost / res.plantArea).toFixed(2)} / m²
                        </div>
                      </div>
                    </div>

                    {/* Multiplier Control */}
                    <div className="mb-8 bg-[#0a0f1d] rounded-2xl p-5 border border-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                          <TrendingUp className="w-3 h-3" /> Local Variance
                        </div>
                        <div className="font-mono text-xs">
                           <span className="text-gray-500 mr-2">{indMult}% LOCAL</span>
                           <span className={`${totalMult > 100 ? 'text-orange-500' : 'text-gray-300'} font-bold`}>
                            {totalMult}% NET
                           </span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="200" 
                        value={indMult} 
                        onChange={(e) => updateIndividualMultiplier(res.type, res.thermal, res.subtype, parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-white hover:accent-orange-500 transition-all"
                      />
                    </div>

                    {/* Data Table */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 px-2">
                        <span>Component</span>
                        <span className="text-right">Rate</span>
                        <span className="text-right">Total</span>
                      </div>
                      <DetailRow label="Structure" unit={res.unitCosts.plant.toFixed(2)} total={res.breakdown.plant} />
                      <DetailRow 
                        label="Foundations" 
                        unit={res.unitCosts.foundations.toFixed(2)} 
                        total={res.breakdown.foundations} 
                        disabled={res.breakdown.foundations === 0}
                      />
                      <DetailRow 
                        label="Flooring" 
                        unit={res.unitCosts.flooring.toFixed(2)} 
                        total={res.breakdown.flooring} 
                        disabled={res.breakdown.flooring === 0}
                      />
                      <DetailRow label="Mezzanines" unit={res.unitCosts.mezzanine.toFixed(2)} total={res.breakdown.mezzanine} />
                      <DetailRow label="Roofing" unit={res.unitCosts.roof.toFixed(2)} total={res.breakdown.roof} />
                      <DetailRow label="Panels (Base)" unit={res.unitCosts.panelBase.toFixed(2)} total={res.breakdown.panelBase} />
                      <DetailRow label="Panels (Finish)" unit={res.unitCosts.panelExtra.toFixed(2)} total={res.breakdown.panelExtra} highlight />
                    </div>

                    {/* Footer Legend */}
                    <div className="mt-8 pt-6 border-t border-gray-800 flex flex-wrap gap-4">
                      <LegendItem label="Structure" value={res.breakdown.plant + res.breakdown.foundations + res.breakdown.flooring} />
                      <LegendItem label="Finishes" value={res.breakdown.roof + res.breakdown.panelBase + res.breakdown.panelExtra} />
                      <LegendItem label="Mezzanines" value={res.breakdown.mezzanine} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="mt-20 border-t border-gray-800 py-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-left">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2">Designed by Efrem Giannessi</h4>
               <p className="text-[9px] text-gray-500 uppercase tracking-wider">Engineering Solutions for Precast Structures</p>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-gray-500">
               <span>v1.0.4 BUILD 2490</span>
               <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
               <span>REACT SYSTEM</span>
               <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
               <span>SECURE</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

// --- Styled Components ---

const InputField: React.FC<{ label: string; name?: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string; }> = ({ label, name, value, onChange, className = "" }) => (
  <div className={className}>
    <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest text-gray-500">{label}</label>
    <div className="relative group">
      <input 
        type="number" 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/50 transition-all placeholder-gray-700"
      />
      <div className="absolute right-2 top-2.5 text-[9px] font-black text-gray-700 pointer-events-none group-focus-within:text-orange-600 transition-colors">
        INPUT
      </div>
    </div>
  </div>
);

const ConfigCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 rounded-xl border border-gray-800 bg-[#0c1120] hover:border-gray-700 transition-colors">
    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
      <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
      {title}
    </h4>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; unit: string; total: number; highlight?: boolean; disabled?: boolean }> = ({ label, unit, total, highlight, disabled }) => (
  <div className={`grid grid-cols-3 py-2 border-b border-gray-800/50 last:border-0 items-center px-2 rounded hover:bg-white/5 transition-colors ${disabled ? 'opacity-30' : ''}`}>
    <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${highlight ? 'text-orange-500' : 'text-gray-400'}`}>{label}</span>
    <span className="text-right text-[10px] font-mono text-gray-600">{unit}</span>
    <span className={`text-right text-[11px] font-mono font-bold ${highlight ? 'text-orange-500' : 'text-white'}`}>€{Math.round(total).toLocaleString()}</span>
  </div>
);

const LegendItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">{label}</span>
    <span className="text-xs font-mono font-bold text-gray-300">€{Math.round(value).toLocaleString()}</span>
  </div>
);

export default App;