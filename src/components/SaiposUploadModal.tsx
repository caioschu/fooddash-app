import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Calendar, TrendingUp, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SaiposUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onDataProcessed: (processedData: ProcessedSalesData[], conflictResolution?: ConflictResolution) => void;
  activeChannels: Array<{ id: string; nome: string; ativo: boolean }>;
  activePaymentMethods: Array<{ id: string; nome: string; ativo: boolean }>;
  onCheckConflicts: (dates: string[]) => Promise<ConflictData[]>; // Nova prop
}

interface ProcessedSalesData {
  data: string;
  canais: Record<string, { valor: number; pedidos: number }>;
  pagamentos: Record<string, number>;
  pedidos: number;
  faturamento: number;
}

interface ConflictData {
  data: string;
  existingValue: number;
  newValue: number;
  existingOrders: number;
  newOrders: number;
}

interface ConflictResolution {
  action: 'replace' | 'keep' | 'sum' | 'individual';
  individualChoices?: Record<string, 'replace' | 'keep' | 'sum'>;
}

interface ChannelMapping {
  [saiposChannel: string]: string;
}

interface PaymentMapping {
  [saiposPayment: string]: string;
}

export const SaiposUploadModal: React.FC<SaiposUploadProps> = ({
  isOpen,
  onClose,
  onDataProcessed,
  activeChannels,
  activePaymentMethods,
  onCheckConflicts
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedSalesData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'conflicts' | 'preview'>('upload');
  
  // Dados para mapeamento
  const [detectedChannels, setDetectedChannels] = useState<string[]>([]);
  const [detectedPayments, setDetectedPayments] = useState<string[]>([]);
  const [channelMapping, setChannelMapping] = useState<ChannelMapping>({});
  const [paymentMapping, setPaymentMapping] = useState<PaymentMapping>({});

  // Dados para conflitos
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>({ action: 'replace' });
  const [individualChoices, setIndividualChoices] = useState<Record<string, 'replace' | 'keep' | 'sum'>>({});

  // Mapeamentos padrão baseados na análise do arquivo
  const defaultChannelMappings: ChannelMapping = {
    'iFood': 'iFood',
    'Delivery Direto': 'Delivery Direto',
    'Telefone': 'Balcão',
    'Anota.ai': 'Anota.ai'
  };

  const defaultPaymentMappings: PaymentMapping = {
    'Pago Online': 'Cartão Online',
    'Crédito': 'Cartão de Crédito',
    'Débito': 'Cartão de Débito', 
    'Dinheiro': 'Dinheiro',
    'Pix': 'Pix',
    'Cartão': 'Cartão',
    'Ticket': 'Vale Refeição',
    'Sodexo': 'Vale Refeição',
    'VR': 'Vale Refeição',
    'Alelo': 'Vale Refeição',
    'Vale': 'Vale Refeição'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().includes('.xlsx') && !selectedFile.name.toLowerCase().includes('.xls')) {
        setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const normalizePayment = (payment: string): string => {
    if (!payment) return 'Outros';
    
    if (payment.includes('Pago Online')) return 'Pago Online';
    if (payment.includes('Crédito') && payment.includes('Débito')) return 'Cartão';
    if (payment.includes('Crédito')) return 'Crédito';
    if (payment.includes('Débito')) return 'Débito';
    if (payment.includes('Dinheiro')) return 'Dinheiro';
    if (payment.includes('Pix')) return 'Pix';
    if (payment.includes('Ticket') || payment.includes('Sodexo') || payment.includes('VR') || payment.includes('Alelo') || payment.includes('Vale')) return 'Ticket';
    
    return payment;
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, {
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });

      // Assumir que a primeira sheet contém os dados
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

      if (jsonData.length === 0) {
        throw new Error('O arquivo não contém dados válidos');
      }

      // Verificar se tem as colunas necessárias
      const firstRow = jsonData[0] as any;
      const requiredColumns = ['Data da venda', 'Canal de venda', 'Pagamento', 'Total', 'Esta cancelado'];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}. Verifique se o arquivo é do Saipos.`);
      }

      // Processar dados
      const salesByDate: Record<string, ProcessedSalesData> = {};
      const channelsFound = new Set<string>();
      const paymentsFound = new Set<string>();

      jsonData.forEach(row => {
        const dataVenda = (row as any)['Data da venda']?.split(' ')[0];
        const canal = (row as any)['Canal de venda'];
        const pagamento = (row as any)['Pagamento'];
        const total = parseFloat((row as any)['Total']) || 0;
        const cancelado = (row as any)['Esta cancelado'] === 'S';
        
        if (!dataVenda || !canal || !pagamento || cancelado || total <= 0) return;
        
        // Converter data do formato DD/MM/YYYY para YYYY-MM-DD
        const [dia, mes, ano] = dataVenda.split('/');
        const dataKey = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        // Adicionar aos conjuntos para mapeamento
        channelsFound.add(canal);
        const normalizedPayment = normalizePayment(pagamento);
        paymentsFound.add(normalizedPayment);
        
        if (!salesByDate[dataKey]) {
          salesByDate[dataKey] = {
            data: dataKey,
            canais: {},
            pagamentos: {},
            pedidos: 0,
            faturamento: 0
          };
        }
        
        // Somar por canal
        if (!salesByDate[dataKey].canais[canal]) {
          salesByDate[dataKey].canais[canal] = { valor: 0, pedidos: 0 };
        }
        salesByDate[dataKey].canais[canal].valor += total;
        salesByDate[dataKey].canais[canal].pedidos += 1;
        
        // Somar por pagamento
        if (!salesByDate[dataKey].pagamentos[normalizedPayment]) {
          salesByDate[dataKey].pagamentos[normalizedPayment] = 0;
        }
        salesByDate[dataKey].pagamentos[normalizedPayment] += total;
        
        salesByDate[dataKey].pedidos += 1;
        salesByDate[dataKey].faturamento += total;
      });

      const processedDataArray = Object.values(salesByDate).sort((a, b) => a.data.localeCompare(b.data));
      
      if (processedDataArray.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Configurar dados para mapeamento
      setDetectedChannels(Array.from(channelsFound));
      setDetectedPayments(Array.from(paymentsFound));
      setProcessedData(processedDataArray);
      
      // Configurar mapeamentos padrão
      const initialChannelMapping: ChannelMapping = {};
      Array.from(channelsFound).forEach(channel => {
        initialChannelMapping[channel] = defaultChannelMappings[channel] || channel;
      });
      setChannelMapping(initialChannelMapping);
      
      const initialPaymentMapping: PaymentMapping = {};
      Array.from(paymentsFound).forEach(payment => {
        initialPaymentMapping[payment] = defaultPaymentMappings[payment] || payment;
      });
      setPaymentMapping(initialPaymentMapping);
      
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMapping = async () => {
    if (!processedData) return;

    setIsProcessing(true);

    try {
      // Aplicar mapeamentos aos dados processados
      const mappedData = processedData.map(dayData => {
        const mappedCanais: Record<string, { valor: number; pedidos: number }> = {};
        const mappedPagamentos: Record<string, number> = {};

        // Mapear canais
        Object.entries(dayData.canais).forEach(([originalChannel, data]) => {
          const mappedChannel = channelMapping[originalChannel] || originalChannel;
          if (!mappedCanais[mappedChannel]) {
            mappedCanais[mappedChannel] = { valor: 0, pedidos: 0 };
          }
          mappedCanais[mappedChannel].valor += data.valor;
          mappedCanais[mappedChannel].pedidos += data.pedidos;
        });

        // Mapear pagamentos
        Object.entries(dayData.pagamentos).forEach(([originalPayment, valor]) => {
          const mappedPayment = paymentMapping[originalPayment] || originalPayment;
          if (!mappedPagamentos[mappedPayment]) {
            mappedPagamentos[mappedPayment] = 0;
          }
          mappedPagamentos[mappedPayment] += valor;
        });

        return {
          ...dayData,
          canais: mappedCanais,
          pagamentos: mappedPagamentos
        };
      });

      setProcessedData(mappedData);

      // Verificar conflitos
      const dates = mappedData.map(d => d.data);
      const conflictData = await onCheckConflicts(dates);
      
      if (conflictData.length > 0) {
        setConflicts(conflictData);
        setStep('conflicts');
      } else {
        setStep('preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar conflitos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveConflicts = () => {
    if (conflictResolution.action === 'individual') {
      setConflictResolution({
        ...conflictResolution,
        individualChoices
      });
    }
    setStep('preview');
  };

  const handleImportData = () => {
    if (processedData) {
      onDataProcessed(processedData, conflicts.length > 0 ? conflictResolution : undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setProcessedData(null);
    setError(null);
    setStep('upload');
    setDetectedChannels([]);
    setDetectedPayments([]);
    setChannelMapping({});
    setPaymentMapping({});
    setConflicts([]);
    setConflictResolution({ action: 'replace' });
    setIndividualChoices({});
    onClose();
  };

  const getTotalStats = () => {
    if (!processedData) return { faturamento: 0, pedidos: 0, dias: 0 };
    
    return processedData.reduce(
      (acc, day) => ({
        faturamento: acc.faturamento + day.faturamento,
        pedidos: acc.pedidos + day.pedidos,
        dias: acc.dias + 1
      }),
      { faturamento: 0, pedidos: 0, dias: 0 }
    );
  };

  if (!isOpen) return null;

  const stats = getTotalStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-orange-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Importar Vendas do Saipos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Faça upload do relatório de vendas do Saipos para importar automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Como obter o relatório do Saipos:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Acesse seu painel do Saipos</li>
                  <li>Vá em Relatórios → Vendas por período</li>
                  <li>Selecione o período desejado</li>
                  <li>Clique em "Exportar" e baixe o arquivo Excel</li>
                  <li>Faça upload do arquivo aqui</li>
                </ol>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Clique para selecionar o arquivo
                  </p>
                  <p className="text-sm text-gray-600">
                    Formatos aceitos: .xlsx, .xls
                  </p>
                </label>
                
                {file && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Arquivo selecionado: {file.name}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={processFile}
                  disabled={!file || isProcessing}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isProcessing ? 'Processando...' : 'Processar Arquivo'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-yellow-900 mb-2">Mapeamento de Dados</h3>
                <p className="text-sm text-yellow-800">
                  Configure como os canais e formas de pagamento do Saipos devem ser mapeados para sua ferramenta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Canais de Venda</h4>
                  <div className="space-y-3">
                    {detectedChannels.map(channel => (
                      <div key={channel} className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                          {channel}
                        </span>
                        <span className="text-gray-400">→</span>
                        <select
                          value={channelMapping[channel] || ''}
                          onChange={(e) => setChannelMapping(prev => ({
                            ...prev,
                            [channel]: e.target.value
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        >
                          <option value="">Selecionar canal</option>
                          {activeChannels.map(ch => (
                            <option key={ch.id} value={ch.nome}>{ch.nome}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Formas de Pagamento</h4>
                  <div className="space-y-3">
                    {detectedPayments.map(payment => (
                      <div key={payment} className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                          {payment}
                        </span>
                        <span className="text-gray-400">→</span>
                        <select
                          value={paymentMapping[payment] || ''}
                          onChange={(e) => setPaymentMapping(prev => ({
                            ...prev,
                            [payment]: e.target.value
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        >
                          <option value="">Selecionar forma</option>
                          {activePaymentMethods.map(pm => (
                            <option key={pm.id} value={pm.nome}>{pm.nome}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmMapping}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isProcessing ? 'Verificando...' : 'Continuar'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'conflicts' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Conflitos Detectados
                  </p>
                  <p className="text-sm text-yellow-700">
                    Foram encontrados {conflicts.length} dias com lançamentos existentes. Como deseja proceder?
                  </p>
                </div>
              </div>

              {/* Opções de resolução */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Escolha uma ação:</h4>
                
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="conflictAction"
                      value="replace"
                      checked={conflictResolution.action === 'replace'}
                      onChange={(e) => setConflictResolution({ action: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Substituir todos</p>
                      <p className="text-sm text-gray-600">Remove os lançamentos existentes e insere os novos dados do arquivo</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="conflictAction"
                      value="keep"
                      checked={conflictResolution.action === 'keep'}
                      onChange={(e) => setConflictResolution({ action: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Manter existentes</p>
                      <p className="text-sm text-gray-600">Mantém os dados atuais e pula os dias em conflito</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="conflictAction"
                      value="sum"
                      checked={conflictResolution.action === 'sum'}
                      onChange={(e) => setConflictResolution({ action: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Somar valores</p>
                      <p className="text-sm text-gray-600">Adiciona os valores do arquivo aos existentes</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="conflictAction"
                      value="individual"
                      checked={conflictResolution.action === 'individual'}
                      onChange={(e) => setConflictResolution({ action: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Escolher individualmente</p>
                      <p className="text-sm text-gray-600">Permite definir ação específica para cada dia</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tabela de conflitos */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Conflitos Detectados</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Atual</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Arquivo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferença</th>
                        {conflictResolution.action === 'individual' && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {conflicts.map(conflict => (
                        <tr key={conflict.data}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(conflict.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            R$ {conflict.existingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-500 block">{conflict.existingOrders} pedidos</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            R$ {conflict.newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-gray-500 block">{conflict.newOrders} pedidos</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-medium ${conflict.newValue > conflict.existingValue ? 'text-green-600' : 'text-red-600'}`}>
                              {conflict.newValue > conflict.existingValue ? '+' : ''}
                              R$ {(conflict.newValue - conflict.existingValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          {conflictResolution.action === 'individual' && (
                            <td className="px-4 py-3">
                              <select
                                value={individualChoices[conflict.data] || 'replace'}
                                onChange={(e) => setIndividualChoices(prev => ({
                                  ...prev,
                                  [conflict.data]: e.target.value as any
                                }))}
                                className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="replace">Substituir</option>
                                <option value="keep">Manter</option>
                                <option value="sum">Somar</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleResolveConflicts}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && processedData && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Dados processados com sucesso! Confira o resumo abaixo.
                </p>
              </div>

              {conflicts.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Resolução de conflitos: {
                      conflictResolution.action === 'replace' ? 'Substituir todos os dados existentes' :
                      conflictResolution.action === 'keep' ? 'Manter dados existentes' :
                      conflictResolution.action === 'sum' ? 'Somar aos dados existentes' :
                      'Ações individuais definidas'
                    }
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {conflicts.length} conflitos detectados
                  </p>
                </div>
              )}

              {/* Cards de resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-600">{stats.dias}</span>
                  </div>
                  <p className="text-sm font-medium text-blue-800">Dias com vendas</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      R$ {stats.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-green-800">Faturamento Total</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">{stats.pedidos}</span>
                  </div>
                  <p className="text-sm font-medium text-purple-800">Total Pedidos</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">
                      R$ {(stats.faturamento / stats.pedidos).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-orange-800">Ticket Médio</p>
                </div>
              </div>

              {/* Tabela de preview */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Preview dos Dados (primeiros 5 dias)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canais</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamentos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {processedData.slice(0, 5).map(day => (
                        <tr key={day.data}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(day.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            R$ {day.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{day.pedidos}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {Object.keys(day.canais).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {Object.keys(day.pagamentos).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {processedData.length > 5 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-200">
                    ... e mais {processedData.length - 5} dias
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(conflicts.length > 0 ? 'conflicts' : 'mapping')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleImportData}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Importar Dados</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};