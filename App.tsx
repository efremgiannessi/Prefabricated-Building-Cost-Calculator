
import React, { useState, useMemo, useEffect } from 'react';
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Building2, 
  Ruler, 
  Euro, 
  ThermometerSun, 
  ThermometerSnowflake,
  Info,
  Calculator, 
  Sun,
  Moon,
  FileCode,
  Settings2,
  Palette,
  Percent,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Files,
  FileText,
  HardHat,
  Square,
  Zap,
  ShieldCheck,
  Globe,
  Printer
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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
      warmShed: 85, // Original + 10
      coldShed: 65  // Original + 10
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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
          
          // Combined Multiplier: Global * Individual
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
          
          // Apply toggle for complementary costs
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
      const key = `${res.type}_res.thermal}_${res.subtype || 'NONE'}`;
      const multiplier = (globalMultiplier / 100) * ((individualMultipliers[key] || 100) / 100) * 100;
      const accentColor = res.thermal === ThermalOption.WARM ? '#f97316' : '#3b82f6';
      
      return `
      <div class="card" style="border-top-color: ${accentColor};">
        <div class="card-body">
          <div class="header">
            <div>
              <div class="title">${res.type} ${res.subtype ? '- ' + res.subtype : ''}</div>
              <div class="thermal-label">Opzione ${res.thermal}</div>
            </div>
            <div class="price-container">
              <div class="total-price">€${Math.round(res.totalCost).toLocaleString('it-IT')}</div>
              <div class="unit-price">€${(res.totalCost / res.plantArea).toFixed(2)}/m²</div>
            </div>
          </div>

          <div class="multiplier-info">
             Variazione Combinata Totale: <strong>${Math.round(multiplier)}%</strong>
             <br><small>*Esclusi pannelli base ed extra finitura</small>
          </div>

          <div class="breakdown">
            <div class="breakdown-header">
              <span>Componente</span>
              <span class="text-right">Unitario (€/m²)</span>
              <span class="text-right">Parziale (€)</span>
            </div>
            <div class="breakdown-row">
              <span>Struttura Prefabbricata</span>
              <span class="text-right">${res.unitCosts.plant.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.plant).toLocaleString()}</span>
            </div>
            <div class="breakdown-row" style="opacity: ${res.breakdown.foundations > 0 ? 1 : 0.5}">
              <span>Fondazioni ${res.breakdown.foundations === 0 ? '(Escluso)' : ''}</span>
              <span class="text-right">${res.unitCosts.foundations.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.foundations).toLocaleString()}</span>
            </div>
            <div class="breakdown-row" style="opacity: ${res.breakdown.flooring > 0 ? 1 : 0.5}">
              <span>Pavimentazione ${res.breakdown.flooring === 0 ? '(Escluso)' : ''}</span>
              <span class="text-right">${res.unitCosts.flooring.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.flooring).toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Soppalchi</span>
              <span class="text-right">${res.unitCosts.mezzanine.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.mezzanine).toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Copertura ${res.subtype ? '('+res.subtype+')' : ''}</span>
              <span class="text-right">${res.unitCosts.roof.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.roof).toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Pannelli Base</span>
              <span class="text-right">${res.unitCosts.panelBase.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.panelBase).toLocaleString()}</span>
            </div>
            <div class="breakdown-row highlight">
              <span>Extra (${res.finish})</span>
              <span class="text-right">${res.unitCosts.panelExtra.toFixed(2)}</span>
              <span class="text-right">€${Math.round(res.breakdown.panelExtra).toLocaleString()}</span>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-item"><span class="dot" style="background: #3b82f6"></span>Struttura: €${Math.round(res.breakdown.plant + res.breakdown.foundations + res.breakdown.flooring).toLocaleString()}</div>
            <div class="summary-item"><span class="dot" style="background: #10b981"></span>Soppalchi: €${Math.round(res.breakdown.mezzanine).toLocaleString()}</div>
            <div class="summary-item"><span class="dot" style="background: #f59e0b"></span>Copertura: €${Math.round(res.breakdown.roof).toLocaleString()}</div>
            <div class="summary-item"><span class="dot" style="background: #ef4444"></span>Pannelli: €${Math.round(res.breakdown.panelBase + res.breakdown.panelExtra).toLocaleString()}</div>
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
      <title>Report Prefabbricato - ${titleSuffix}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; background-color: #f8fafc; color: #1e293b; margin: 0; }
        .report-header { margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .report-header h1 { margin: 0; font-size: 28px; color: #0f172a; font-weight: 900; }
        .report-header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.6; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
        .card { background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-top: 5px solid #3b82f6; overflow: hidden; break-inside: avoid; margin-bottom: 20px;}
        .card-body { padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 800; color: #0f172a; }
        .thermal-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 4px; letter-spacing: 0.05em; }
        .price-container { text-align: right; }
        .total-price { font-size: 26px; font-weight: 900; color: #0f172a; }
        .unit-price { font-size: 15px; font-weight: 700; color: #3b82f6; }
        .multiplier-info { background: #f1f5f9; padding: 14px; border-radius: 10px; font-size: 12px; margin-bottom: 20px; color: #475569; border: 1px solid #e2e8f0; }
        .breakdown { margin-top: 20px; }
        .breakdown-header { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px; letter-spacing: 0.05em; }
        .breakdown-row { display: grid; grid-template-columns: 2fr 1fr 1fr; font-size: 12px; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
        .breakdown-row.highlight { color: #3b82f6; font-weight: 700; background: #eff6ff; margin: 0 -10px; padding: 8px 10px; border-radius: 6px; }
        .text-right { text-align: right; }
        .summary-grid { margin-top: 24px; padding-top: 20px; border-top: 2px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .summary-item { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        
        .report-footer { margin-top: 60px; padding: 60px 40px; background: #0f172a; border-radius: 24px; text-align: center; color: white; break-inside: avoid; }
        .footer-header { color: #3b82f6; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; display: block; }
        .dev-credit { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
        .dev-credit span { color: #3b82f6; }
        .dev-sub { font-size: 14px; font-style: italic; opacity: 0.5; margin-bottom: 32px; }
        .footer-meta { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; opacity: 0.6; margin-bottom: 24px; }
        .footer-url { color: #3b82f6; text-decoration: none; margin-left: 10px; }
        .legal-box { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; background: rgba(255,255,255,0.02); max-width: 600px; margin: 0 auto; }
        .legal-text { font-size: 9px; opacity: 0.4; text-transform: uppercase; line-height: 1.6; letter-spacing: 0.05em; }

        @page {
          size: A4;
          margin: 15mm;
        }

        @media print { 
          body { 
            background: white !important; 
            padding: 0 !important; 
          }
          .card { 
            break-inside: avoid; 
            margin-bottom: 20px; 
            box-shadow: none; 
            border: 1px solid #e2e8f0;
            border-top: 5px solid;
          }
          .multiplier-info, .breakdown-row.highlight, .report-footer {
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
          }
          .grid {
            display: block;
          }
          .card {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${titleSuffix}</h1>
        <p>Dimensioni: ${dimensions.length}x${dimensions.width}m | Altezza: ${dimensions.height}m</p>
        <p>Data: ${timestamp} | Finitura Pannelli: ${selectedFinish}</p>
      </div>
      <div class="grid">
        ${cardHtml}
      </div>
      
      <div class="report-footer">
        <span class="footer-header">Proprietà Intellettuale & Sviluppo</span>
        <div class="dev-credit">Software progettato e sviluppato da <span>Efrem Giannessi</span></div>
        <div class="dev-sub">Specialized Engineering Solutions for Precast Concrete Structures</div>
        
        <div class="footer-meta">
          © 2024-2025 ALL RIGHTS RESERVED • <a href="https://efremgiannessi.org" class="footer-url">EFREMGIANNESSI.ORG</a>
        </div>

        <div class="legal-box">
          <p class="legal-text">
            AVVISO LEGALE: QUESTO SOFTWARE E GLI ALGORITMI DI CALCOLO CONTENUTI SONO DI PROPRIETÀ ESCLUSIVA DI EFREM GIANNESSI. 
            QUALSIASI RIPRODUZIONE, DISTRIBUZIONE O UTILIZZO NON AUTORIZZATO DEL CODICE SORGENTE O DELLE LOGICHE TECNICHE È SEVERAMENTE VIETATO.
          </p>
        </div>
      </div>
    </body>
    </html>`;
  };

  const exportSelected = () => {
    const html = generateReportHtml(filteredResults, `Analisi Prefabbricato: ${selectedType}`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${selectedType.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const html = generateReportHtml(calculateResults, `Report Completo Prefabbricati`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_completo.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const html = generateReportHtml(calculateResults, `Stampa Professionale Prefabbricati`);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Giving a moment for the print-friendly styles and layout to stabilize
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar */}
      <aside className={`w-full lg:w-96 border-r lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto transition-colors custom-scrollbar ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white leading-tight">Prefabricated Building Cost Calculator</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-1">Configuratore Industriale</p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 ml-2">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-6 space-y-8 pb-10">
          {/* Section 1: Dimensions */}
          <section>
            <div className="flex items-center gap-2 mb-4 font-semibold uppercase text-xs tracking-wider opacity-70">
              <Ruler className="w-4 h-4" /> Dimensioni Edificio
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Lunghezza (m)" name="length" value={dimensions.length} onChange={handleDimChange} darkMode={darkMode} />
              <InputField label="Larghezza (m)" name="width" value={dimensions.width} onChange={handleDimChange} darkMode={darkMode} />
              <InputField label="Altezza (m)" name="height" value={dimensions.height} onChange={handleDimChange} darkMode={darkMode} />
              <InputField label="Soppalchi (m²)" name="mezzanineArea" value={dimensions.mezzanineArea} onChange={handleDimChange} darkMode={darkMode} />
              <InputField label="Coperta (m²)" name="coveredArea" value={dimensions.coveredArea} onChange={handleDimChange} className="col-span-2" darkMode={darkMode} />
            </div>
          </section>

          {/* Master Global Multiplier Slider */}
          <section className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600">
                <Zap className="w-4 h-4" /> Variazione Prezzi Globale
              </div>
              <div className={`text-sm font-black ${globalMultiplier > 100 ? 'text-rose-500' : globalMultiplier < 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                {globalMultiplier}%
              </div>
            </div>
            <input 
              type="range" 
              min="50" 
              max="200" 
              value={globalMultiplier} 
              onChange={(e) => setGlobalMultiplier(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[8px] font-bold opacity-30">-50%</span>
              <span className="text-[8px] font-bold opacity-30">BASE</span>
              <span className="text-[8px] font-bold opacity-30">+100%</span>
            </div>
          </section>

          {/* Costi Base Pannelli (Grigio Base) */}
          <section>
            <div className="flex items-center gap-2 mb-4 font-semibold uppercase text-xs tracking-wider opacity-70">
              <Square className="w-4 h-4" /> Costi Base Pannelli (€/m²)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Pannello Caldo" 
                value={costs.panelCostWarm} 
                onChange={(e) => setCosts(prev => ({ ...prev, panelCostWarm: parseFloat(e.target.value) || 0 }))} 
                darkMode={darkMode} 
              />
              <InputField 
                label="Pannello Freddo" 
                value={costs.panelCostCold} 
                onChange={(e) => setCosts(prev => ({ ...prev, panelCostCold: parseFloat(e.target.value) || 0 }))} 
                darkMode={darkMode} 
              />
            </div>
          </section>

          {/* Costi Complementari */}
          <section className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-amber-600">
                <HardHat className="w-4 h-4" /> Costi Complementari
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-[9px] font-bold opacity-40 group-hover:opacity-100 uppercase transition-opacity">Considera nel totale</span>
                <input 
                  type="checkbox" 
                  checked={includeComplementary}
                  onChange={(e) => setIncludeComplementary(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Fondazioni (m²)" value={dimensions.foundationArea} onChange={(e) => setDimensions(d => ({...d, foundationArea: parseFloat(e.target.value) || 0}))} darkMode={darkMode} />
                <InputField label="€/m² Fond." value={costs.foundationUnitCost} onChange={(e) => setCosts(c => ({...c, foundationUnitCost: parseFloat(e.target.value) || 0}))} darkMode={darkMode} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Pavimento (m²)" value={dimensions.flooringArea} onChange={(e) => setDimensions(d => ({...d, flooringArea: parseFloat(e.target.value) || 0}))} darkMode={darkMode} />
                <InputField label="€/m² Pavim." value={costs.flooringUnitCost} onChange={(e) => setCosts(c => ({...c, flooringUnitCost: parseFloat(e.target.value) || 0}))} darkMode={darkMode} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 font-semibold uppercase text-xs tracking-wider opacity-70">
              <Palette className="w-4 h-4" /> Finitura Pannelli
            </div>
            <div className="space-y-2">
              {Object.values(PanelFinish).map((finish) => (
                <button
                  key={finish}
                  onClick={() => setSelectedFinish(finish)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    selectedFinish === finish 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{finish}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedFinish === finish ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    +{costs.finishExtras[finish]} €/m²
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2 font-semibold uppercase text-xs tracking-wider opacity-70">
              <Layers className="w-4 h-4" /> Configurazione Tipologie (€/m²)
            </div>
            
            <div className="max-h-[60vh] lg:max-h-[500px] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {/* Bacacier Section */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Bacacier</h4>
                <div className="space-y-4">
                  <InputField label="Struttura (Pianta)" value={costs.bacacier.plant} onChange={(e) => handleNestedCostChange('bacacier', 'plant', e.target.value)} darkMode={darkMode} />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <InputField label="Tetto Caldo Cieco" value={costs.bacacier.warmCieco} onChange={(e) => handleNestedCostChange('bacacier', 'warmCieco', e.target.value)} darkMode={darkMode} />
                    <InputField label="Tetto Freddo Cieco" value={costs.bacacier.coldCieco} onChange={(e) => handleNestedCostChange('bacacier', 'coldCieco', e.target.value)} darkMode={darkMode} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                      <InputField label="Tetto Caldo Lucernari" value={costs.bacacier.warmLucernari} onChange={(e) => handleNestedCostChange('bacacier', 'warmLucernari', e.target.value)} darkMode={darkMode} />
                      <span className="text-[8px] opacity-40 mt-1 uppercase font-bold text-blue-500">(Suggerito: Caldo +20€)</span>
                    </div>
                    <div className="flex flex-col">
                      <InputField label="Tetto Freddo Lucernari" value={costs.bacacier.coldLucernari} onChange={(e) => handleNestedCostChange('bacacier', 'coldLucernari', e.target.value)} darkMode={darkMode} />
                      <span className="text-[8px] opacity-40 mt-1 uppercase font-bold text-blue-500">(Suggerito: Freddo +20€)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monolitica Section */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Monolitica</h4>
                <div className="space-y-4">
                  <InputField label="Struttura (Pianta)" value={costs.monolithic.plant} onChange={(e) => handleNestedCostChange('monolithic', 'plant', e.target.value)} darkMode={darkMode} />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <InputField label="Cieco Caldo" value={costs.monolithic.warmCieco} onChange={(e) => handleNestedCostChange('monolithic', 'warmCieco', e.target.value)} darkMode={darkMode} />
                    <InputField label="Cieco Freddo" value={costs.monolithic.coldCieco} onChange={(e) => handleNestedCostChange('monolithic', 'coldCieco', e.target.value)} darkMode={darkMode} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                      <InputField label="Shed Caldo" value={costs.monolithic.warmShed} onChange={(e) => handleNestedCostChange('monolithic', 'warmShed', e.target.value)} darkMode={darkMode} />
                      <span className="text-[8px] opacity-40 mt-1 uppercase font-bold text-blue-500">(Suggerito: +10€)</span>
                    </div>
                    <div className="flex flex-col">
                      <InputField label="Shed Freddo" value={costs.monolithic.coldShed} onChange={(e) => handleNestedCostChange('monolithic', 'coldShed', e.target.value)} darkMode={darkMode} />
                      <span className="text-[8px] opacity-40 mt-1 uppercase font-bold text-blue-500">(Suggerito: +10€)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alare Section */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Alare</h4>
                <div className="space-y-3">
                  <InputField label="Struttura (Pianta)" value={costs.alare.plant} onChange={(e) => handleNestedCostChange('alare', 'plant', e.target.value)} darkMode={darkMode} />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <InputField label="Shed Caldo" value={costs.alare.warmShed} onChange={(e) => handleNestedCostChange('alare', 'warmShed', e.target.value)} darkMode={darkMode} />
                    <InputField label="Cieco Caldo" value={costs.alare.warmCieco} onChange={(e) => handleNestedCostChange('alare', 'warmCieco', e.target.value)} darkMode={darkMode} />
                    <InputField label="Shed Freddo" value={costs.alare.coldShed} onChange={(e) => handleNestedCostChange('alare', 'coldShed', e.target.value)} darkMode={darkMode} />
                    <InputField label="Cieco Freddo" value={costs.alare.coldCieco} onChange={(e) => handleNestedCostChange('alare', 'coldCieco', e.target.value)} darkMode={darkMode} />
                  </div>
                </div>
              </div>

              {/* Piana Section */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Piana</h4>
                <div className="grid grid-cols-1 gap-3">
                  <InputField label="Struttura (Pianta)" value={costs.flat.plant} onChange={(e) => handleNestedCostChange('flat', 'plant', e.target.value)} darkMode={darkMode} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Tetto Caldo" value={costs.flat.roofWarm} onChange={(e) => handleNestedCostChange('flat', 'roofWarm', e.target.value)} darkMode={darkMode} />
                    <InputField label="Tetto Freddo" value={costs.flat.roofCold} onChange={(e) => handleNestedCostChange('flat', 'roofCold', e.target.value)} darkMode={darkMode} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 pb-4">
            <div className="flex items-center gap-2 mb-2 font-semibold uppercase text-xs tracking-wider opacity-70">
              <Files className="w-4 h-4" /> Esportazione Report
            </div>
            <button onClick={printPdf} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95">
              <Printer className="w-5 h-5" /> Stampa PDF (A4)
            </button>
            <button onClick={exportSelected} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <FileText className="w-5 h-5" /> Report {selectedType}
            </button>
            <button onClick={exportAll} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
              <Files className="w-5 h-5" /> Report Completo
            </button>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Prefabricated Building Cost Calculator</h2>
            <p className="opacity-60 text-sm">Finitura: <span className="font-bold text-blue-500">{selectedFinish}</span></p>
          </div>
          <div className={`flex p-1 rounded-xl shadow-sm border transition-colors overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {Object.values(StructureType).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedType === type ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {filteredResults.map((res, idx) => {
            const key = `${res.type}_${res.thermal}_${res.subtype || 'NONE'}`;
            const indMult = individualMultipliers[key] || 100;
            const totalMult = Math.round((globalMultiplier / 100) * (indMult / 100) * 100);

            return (
              <div key={idx} className={`rounded-2xl shadow-lg border-t-4 overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${res.thermal === ThermalOption.WARM ? 'border-t-orange-500' : 'border-t-blue-500'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {res.thermal === ThermalOption.WARM ? <ThermometerSun className="w-5 h-5 text-orange-500" /> : <ThermometerSnowflake className="w-5 h-5 text-blue-500" />}
                        {res.type} {res.subtype ? `- ${res.subtype}` : ''}
                      </h3>
                      <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Opzione {res.thermal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">€{Math.round(res.totalCost).toLocaleString('it-IT')}</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        €{(res.totalCost / res.plantArea).toFixed(2)}/m²
                      </div>
                    </div>
                  </div>

                  {/* Multiplier Slider */}
                  <div className={`mb-6 p-4 rounded-xl border-2 transition-all ${indMult === 100 ? (darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100') : (indMult > 100 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest opacity-60">
                        {indMult > 100 ? <TrendingUp className="w-3 h-3 text-rose-500" /> : indMult < 100 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <Percent className="w-3 h-3" />}
                        Variazione Locale Tipologia
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold opacity-40`}>Locale: {indMult}%</span>
                         <span className={`text-sm font-black ${totalMult > 100 ? 'text-rose-500' : totalMult < 100 ? 'text-emerald-500' : ''}`}>
                          Tot: {totalMult}%
                         </span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="200" 
                      value={indMult} 
                      onChange={(e) => updateIndividualMultiplier(res.type, res.thermal, res.subtype, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[9px] mt-1 opacity-40 uppercase font-bold">*Variazione tipologia + Variazione Globale ({globalMultiplier}%)</p>
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-3 text-[10px] font-bold opacity-30 uppercase tracking-tighter mb-2 pb-1 border-b">
                      <span>Componente</span>
                      <span className="text-right">Unitario</span>
                      <span className="text-right">Parziale</span>
                    </div>
                    <DetailParziale label="Struttura Prefab" unit={res.unitCosts.plant.toFixed(2)} total={res.breakdown.plant} darkMode={darkMode} />
                    <DetailParziale 
                      label={`Fondazioni ${res.breakdown.foundations === 0 ? '(Escl.)' : ''}`} 
                      unit={res.unitCosts.foundations.toFixed(2)} 
                      total={res.breakdown.foundations} 
                      darkMode={darkMode} 
                      disabled={res.breakdown.foundations === 0}
                    />
                    <DetailParziale 
                      label={`Pavimentazione ${res.breakdown.flooring === 0 ? '(Escl.)' : ''}`} 
                      unit={res.unitCosts.flooring.toFixed(2)} 
                      total={res.breakdown.flooring} 
                      darkMode={darkMode} 
                      disabled={res.breakdown.flooring === 0}
                    />
                    <DetailParziale label="Soppalchi" unit={res.unitCosts.mezzanine.toFixed(2)} total={res.breakdown.mezzanine} darkMode={darkMode} />
                    <DetailParziale label={`Copertura ${res.subtype ? '('+res.subtype+')' : ''}`} unit={res.unitCosts.roof.toFixed(2)} total={res.breakdown.roof} darkMode={darkMode} />
                    <DetailParziale label="Pannelli Base" unit={res.unitCosts.panelBase.toFixed(2)} total={res.breakdown.panelBase} darkMode={darkMode} />
                    <DetailParziale label={`Extra Pannelli`} unit={res.unitCosts.panelExtra.toFixed(2)} total={res.breakdown.panelExtra} darkMode={darkMode} highlight />
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <LegendItem color="bg-blue-500" label="Sottostruttura" value={res.breakdown.plant + res.breakdown.foundations + res.breakdown.flooring} darkMode={darkMode} />
                    <LegendItem color="bg-emerald-500" label="Soppalchi" value={res.breakdown.mezzanine} darkMode={darkMode} />
                    <LegendItem color="bg-amber-500" label="Copertura" value={res.breakdown.roof} darkMode={darkMode} />
                    <LegendItem color="bg-rose-500" label="Pannelli" value={res.breakdown.panelBase + res.breakdown.panelExtra} darkMode={darkMode} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-10 p-5 rounded-xl border flex items-start gap-4 transition-colors ${darkMode ? 'bg-blue-900/10 border-blue-900/30 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
          <Info className="w-6 h-6 shrink-0 opacity-70 mt-1" />
          <div className="text-sm leading-relaxed">
            <strong className="block mb-2 text-base">Note:</strong>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Barra Master Globale:</strong> Utilizza lo slider in alto nella sidebar per regolare i prezzi di tutti i modelli contemporaneamente.</li>
              <li><strong>Opere Complementari:</strong> Usa il flag "Considera nel totale" per includere o escludere fondazioni e pavimento dal calcolo finale.</li>
              <li><strong>Bacacier & Monolitica:</strong> Sono presenti varianti separate per configurazioni Cieche e Shed/Lucernari.</li>
              <li><strong>Stampa PDF:</strong> Il report è ottimizzato per la stampa in formato A4 con grafica professionale.</li>
            </ul>
          </div>
        </div>

        {/* Professional Footer */}
        <footer className={`mt-20 p-10 md:p-16 rounded-3xl text-center space-y-10 transition-colors ${darkMode ? 'bg-[#030712] border border-slate-800' : 'bg-slate-900 text-white'}`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-white/10'}`}>
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">PROPRIETÀ INTELLETTUALE & SVILUPPO</h4>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-black">
              Software progettato e sviluppato da <span className="text-blue-500">Efrem Giannessi</span>
            </h3>
            <p className="text-sm md:text-base opacity-40 font-medium italic">
              Specialized Engineering Solutions for Precast Concrete Structures
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-[10px] font-bold tracking-widest opacity-60">
            <div className="flex items-center gap-2">
              <span className="text-lg">©</span> 2024-2025 ALL RIGHTS RESERVED
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <a href="https://efremgiannessi.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase">
              <Globe className="w-3.5 h-3.5" /> EFREMGIANNESSI.ORG
            </a>
          </div>

          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/30 border-slate-800/50' : 'bg-white/5 border-white/10'}`}>
            <p className="text-[9px] md:text-[10px] leading-relaxed uppercase tracking-wider font-semibold opacity-40 max-w-3xl mx-auto">
              AVVISO LEGALE: QUESTO SOFTWARE E GLI ALGORITMI DI CALCOLO CONTENUTI SONO DI PROPRIETÀ ESCLUSIVA DI EFREM GIANNESSI. 
              QUALSIASI RIPRODUZIONE, DISTRIBUZIONE O UTILIZZO NON AUTORIZZATO DEL CODICE SORGENTE O DELLE LOGICHE TECNICHE È SEVERAMENTE VIETATO.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

// --- Helper Components ---
const InputField: React.FC<{ label: string; name?: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string; darkMode: boolean; }> = ({ label, name, value, onChange, className = "", darkMode }) => (
  <div className={className}>
    <label className={`block text-[9px] font-bold mb-1 uppercase tracking-wider opacity-60`}>{label}</label>
    <input type="number" name={name} value={value} onChange={onChange} className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
  </div>
);

const DetailParziale: React.FC<{ label: string; unit: string; total: number; darkMode: boolean; highlight?: boolean; disabled?: boolean }> = ({ label, unit, total, darkMode, highlight, disabled }) => (
  <div className={`grid grid-cols-3 py-1.5 border-b border-dashed last:border-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'} ${highlight ? 'text-blue-500 font-bold' : (disabled ? 'opacity-30 italic' : 'opacity-80')}`}>
    <span className="text-xs truncate pr-1">{label}</span>
    <span className="text-right text-[10px] font-mono opacity-50 tabular-nums">{unit}</span>
    <span className="text-right text-xs font-bold tabular-nums">€{Math.round(total).toLocaleString()}</span>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string; value: number; darkMode: boolean }> = ({ color, label, value, darkMode }) => (
  <div className="flex items-center gap-2 py-1">
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
    <span className="opacity-50 flex-1 truncate text-[11px]">{label}</span>
    <span className={`font-semibold text-[11px] ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>€{Math.round(value).toLocaleString()}</span>
  </div>
);

export default App;
