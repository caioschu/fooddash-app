import React, { useState, useEffect } from 'react';
import { Camera, Plus, X, Check, Save, ToggleLeft, ToggleRight, AlertCircle, Monitor, Upload, Loader, Trash2, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { supabase } from '../../lib/supabase';

const categoriasCulinarias = [
  'Açaí', 'Árabe', 'Argentina', 'Asiática', 'Baiana', 'Bebidas', 'Brasileira', 
  'Cafeteria', 'Carnes', 'Chinesa', 'Coreana', 'Crepe', 'Doces & Bolos', 
  'Fast Food', 'Frutos do Mar', 'Hambúrguer', 'Indiana', 'Italiana', 'Japonesa', 
  'Lanches', 'Lanchonete', 'Mediterrânea', 'Mexicana', 'Marmita', 'Natural', 
  'Padaria', 'Pastel', 'Peixes', 'Pizza', 'Portuguesa', 'Salgados', 'Saudável', 
  'Sobremesas', 'Sorvetes', 'Sushi', 'Tailandesa', 'Vegetariana', 'Vegana', 'Outro'
];

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const pdvErpOptions = [
  'Saipos',
  'Consumer',
  'Colibri',
  'Totvs',
  'SisChef',
  'Goomer',
  'Deeliv'
];

// Componente para ícones dos canais de venda
const ChannelIcon: React.FC<{ channelName: string; className?: string }> = ({ channelName, className = "w-8 h-8" }) => {
  const name = channelName.toLowerCase();
  
  if (name.includes('ifood')) {
    return (
      <div className={`${className} bg-red-500 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    );
  } else if (name.includes('rappi')) {
    return (
      <div className={`${className} bg-orange-500 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    );
  } else if (name.includes('uber')) {
    return (
      <div className={`${className} bg-black rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
    );
  } else if (name.includes('whatsapp')) {
    return (
      <div className={`${className} bg-green-500 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
        </svg>
      </div>
    );
  } else if (name.includes('salão') || name.includes('salon')) {
    return (
      <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    );
  } else if (name.includes('balcão') || name.includes('retirada')) {
    return (
      <div className={`${className} bg-purple-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
        </svg>
      </div>
    );
  } else if (name.includes('telefone')) {
    return (
      <div className={`${className} bg-indigo-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </div>
    );
  } else if (name.includes('app') || name.includes('próprio')) {
    return (
      <div className={`${className} bg-teal-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
        </svg>
      </div>
    );
  } else if (name.includes('delivery')) {
    return (
      <div className={`${className} bg-yellow-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    );
  } else {
    return (
      <div className={`${className} bg-gray-600 rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
      </div>
    );
  }
};

export const Profile: React.FC = () => {
  const {
    restaurant,
    salesChannels,
    paymentMethods,
    isLoading,
    updateRestaurant,
    addSalesChannel,
    updateSalesChannel,
    removeSalesChannel,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod
  } = useRestaurant();

  // Form states
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('MG');
  const [telefone, setTelefone] = useState('');
  const [categoria, setCategoria] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [pdvErp, setPdvErp] = useState('');
  const [outroPdvErp, setOutroPdvErp] = useState('');
  const [novoCanal, setNovoCanal] = useState('');
  const [novaTaxaCanal, setNovaTaxaCanal] = useState('');
  const [novaForma, setNovaForma] = useState('');
  const [novaTaxaForma, setNovaTaxaForma] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para controlar seções expandidas - CANAIS E PAGAMENTOS VISÍVEIS POR PADRÃO
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    channels: true,
    payments: true
  });

  // Load restaurant data when available
  useEffect(() => {
    if (restaurant) {
      setNome(restaurant.nome || '');
      setCnpj(restaurant.cnpj || '');
      setCidade(restaurant.cidade || '');
      setEstado(restaurant.estado || 'MG');
      setTelefone(restaurant.telefone || '');
      setCategoria(restaurant.categoria_culinaria || '');
      setLogoUrl(restaurant.logo_url || '');
      
      // Handle PDV/ERP field
      const currentPdv = restaurant.pdv_erp || '';
      if (pdvErpOptions.includes(currentPdv)) {
        setPdvErp(currentPdv);
        setOutroPdvErp('');
      } else if (currentPdv) {
        setPdvErp('Outro');
        setOutroPdvErp(currentPdv);
      } else {
        setPdvErp('');
        setOutroPdvErp('');
      }
    }
  }, [restaurant]);

  // Calculate profile completeness
  const completude = Math.round((
    (nome ? 20 : 0) +
    (cidade ? 15 : 0) +
    (estado ? 10 : 0) +
    (categoria ? 20 : 0) +
    (telefone ? 10 : 0) +
    (pdvErp ? 15 : 0) +
    (salesChannels.length > 0 ? 10 : 0)
  ));

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ Arquivo muito grande! Máximo 5MB permitido.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('❌ Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      setIsUploading(true);

      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `restaurant-logos/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('restaurant-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert('❌ Erro ao fazer upload da imagem. Tente novamente.');
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('restaurant-assets')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          setLogoUrl(urlData.publicUrl);
          showSuccessMessage('✅ Logo carregado com sucesso!');
        } else {
          alert('❌ Erro ao obter URL da imagem.');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('❌ Erro inesperado ao fazer upload. Tente novamente.');
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleSaveBasicInfo = async () => {
    setIsSaving(true);
    try {
      // Determine final PDV/ERP value
      const finalPdvErp = pdvErp === 'Outro' ? outroPdvErp : pdvErp;
      
      const success = await updateRestaurant({
        nome,
        cnpj: cnpj || null,
        cidade,
        estado,
        telefone: telefone || null,
        categoria_culinaria: categoria,
        logo_url: logoUrl || null,
        pdv_erp: finalPdvErp || null,
        completude_perfil: completude
      });

      if (success) {
        showSuccessMessage('✅ Informações salvas com sucesso!');
      } else {
        alert('❌ Erro ao salvar informações. Tente novamente.');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('❌ Erro ao salvar informações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    await handleSaveBasicInfo();
  };

  const adicionarCanal = async () => {
    if (novoCanal && !salesChannels.find(c => c.nome === novoCanal)) {
      const taxa = parseFloat(novaTaxaCanal) || 0;
      const success = await addSalesChannel(novoCanal, taxa);
      if (success) {
        setNovoCanal('');
        setNovaTaxaCanal('');
        showSuccessMessage('✅ Canal adicionado com sucesso!');
        
        // Se for iFood, sugerir pagamento online
        if (novoCanal.toLowerCase().includes('ifood')) {
          const hasOnlinePayment = paymentMethods.find(p => p.nome.includes('Online iFood'));
          if (!hasOnlinePayment) {
            await addPaymentMethod('Pagamento Online iFood', 4.8);
          }
        }
      }
    }
  };

  const adicionarFormaPagamento = async () => {
    if (novaForma && !paymentMethods.find(f => f.nome === novaForma)) {
      const taxa = parseFloat(novaTaxaForma) || 0;
      const success = await addPaymentMethod(novaForma, taxa);
      if (success) {
        setNovaForma('');
        setNovaTaxaForma('');
        showSuccessMessage('✅ Forma de pagamento adicionada!');
      }
    }
  };

  const toggleChannelStatus = async (id: string, currentStatus: boolean) => {
    await updateSalesChannel(id, { ativo: !currentStatus });
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    await updatePaymentMethod(id, { ativo: !currentStatus });
  };

  const atualizarTaxaCanal = async (id: string, taxa: number) => {
    await updateSalesChannel(id, { taxa_percentual: taxa });
  };

  const atualizarFormaPagamento = async (id: string, updates: any) => {
    await updatePaymentMethod(id, updates);
  };

  const handleDeleteChannel = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o canal "${nome}"?`)) {
      const success = await removeSalesChannel(id);
      if (success) {
        showSuccessMessage('✅ Canal excluído com sucesso!');
      }
    }
  };

  const handleDeletePaymentMethod = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a forma de pagamento "${nome}"?`)) {
      const success = await removePaymentMethod(id);
      if (success) {
        showSuccessMessage('✅ Forma de pagamento excluída com sucesso!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil do Restaurante</h1>
          <p className="text-gray-600 mt-1">Configure rapidamente os dados essenciais</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Completude do perfil</div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-24 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-orange-600 rounded-full transition-all duration-300"
                style={{ width: `${completude}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">{completude}%</span>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center">
              {completude >= 80 ? (
                <Check className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              )}
              {completude >= 80 ? 
                'Perfil completo! Pronto para benchmarking' :
                'Complete seu perfil para acessar comparações'
              }
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {categoria && cidade && estado ? 
                `Você será comparado com restaurantes de ${categoria} em ${cidade}, ${estado}` :
                'Preencha os campos obrigatórios para ativar o benchmarking'
              }
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('profile')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveBasicInfo();
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
              {expandedSections.profile ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.profile && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo do Restaurante
                </label>
                <div className="flex items-center space-x-4">
                  <div 
                    onClick={handleLogoUpload}
                    className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors cursor-pointer overflow-hidden group relative"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader className="w-6 h-6 text-orange-600 animate-spin mb-1" />
                        <span className="text-xs text-orange-600">Upload...</span>
                      </div>
                    ) : logoUrl ? (
                      <div className="relative w-full h-full">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="URL da imagem do logo (ex: https://exemplo.com/logo.png)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📸 Clique no ícone para fazer upload ou cole uma URL de imagem
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Restaurante *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Ex: Sushi House"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ (opcional)
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Ex: Belo Horizonte"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                >
                  {estados.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="(31) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria Culinária *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasCulinarias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* PDV/ERP Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-gray-500" />
                  Sistema PDV/ERP Utilizado
                </label>
                <div className="space-y-3">
                  <select
                    value={pdvErp}
                    onChange={(e) => setPdvErp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Selecione seu sistema PDV/ERP</option>
                    {pdvErpOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value="Outro">Outro (especificar)</option>
                  </select>
                  
                  {pdvErp === 'Outro' && (
                    <input
                      type="text"
                      value={outroPdvErp}
                      onChange={(e) => setOutroPdvErp(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Digite o nome do seu sistema PDV/ERP"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Esta informação nos ajuda a entender melhor seu negócio e oferecer integrações futuras
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: CANAIS DE VENDA - VISÍVEL POR PADRÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('channels')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-orange-600">📱</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Canais de Venda</h2>
                <p className="text-sm text-gray-600">Configure seus canais e taxas</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{salesChannels.length} canais</span>
              {expandedSections.channels ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.channels && (
          <div className="p-6">
            <div className="space-y-4">
              {salesChannels.map((canal) => (
                <div key={canal.id} className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                  canal.ativo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    onClick={() => toggleChannelStatus(canal.id, canal.ativo)}
                    className="flex-shrink-0"
                  >
                    {canal.ativo ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <ChannelIcon channelName={canal.nome} />
                    <span className={`font-medium ${canal.ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                      {canal.nome}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={canal.taxa_percentual}
                      onChange={(e) => atualizarTaxaCanal(canal.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                      step="0.01"
                      disabled={!canal.ativo}
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>

                  {!['Salão', 'iFood', 'WhatsApp', 'Telefone', 'Retirada (balcão)', 'App próprio'].includes(canal.nome) && (
                    <button
                      onClick={() => handleDeleteChannel(canal.id, canal.nome)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir canal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar Novo Canal</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={novoCanal}
                    onChange={(e) => setNovoCanal(e.target.value)}
                    placeholder="Nome do canal..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={novaTaxaCanal}
                    onChange={(e) => setNovaTaxaCanal(e.target.value)}
                    placeholder="Taxa %"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    step="0.01"
                  />
                  <button
                    onClick={adicionarCanal}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: FORMAS DE PAGAMENTO - VISÍVEL POR PADRÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('payments')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">💳</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Formas de Pagamento</h2>
                <p className="text-sm text-gray-600">Configure taxas e antecipação</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{paymentMethods.length} formas</span>
              {expandedSections.payments ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.payments && (
          <div className="p-6">
            <div className="space-y-4">
              {paymentMethods.map((forma) => (
                <div key={forma.id} className={`p-4 rounded-lg border-2 transition-all ${
                  forma.ativo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-4 mb-3">
                    <button
                      onClick={() => togglePaymentStatus(forma.id, forma.ativo)}
                      className="flex-shrink-0"
                    >
                      {forma.ativo ? (
                        <ToggleRight className="w-8 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <span className={`font-medium ${forma.ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                        {forma.nome}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={forma.taxa_percentual}
                        onChange={(e) => atualizarFormaPagamento(forma.id, { taxa_percentual: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                        step="0.01"
                        disabled={!forma.ativo}
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>

                    {!['Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Dinheiro', 'Vale Refeição', 'Pagamento Online iFood', 'Pagamento Online App'].includes(forma.nome) && (
                      <button
                        onClick={() => handleDeletePaymentMethod(forma.id, forma.nome)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir forma de pagamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {forma.ativo && (
                    <div className="ml-12 flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={forma.tem_antecipacao || false}
                          onChange={(e) => atualizarFormaPagamento(forma.id, { tem_antecipacao: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Tem antecipação</span>
                      </label>
                      
                      {forma.tem_antecipacao && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Taxa:</span>
                          <input
                            type="number"
                            value={forma.taxa_antecipacao || 0}
                            onChange={(e) => atualizarFormaPagamento(forma.id, { taxa_antecipacao: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            step="0.01"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar Nova Forma de Pagamento</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={novaForma}
                    onChange={(e) => setNovaForma(e.target.value)}
                    placeholder="Nome da forma de pagamento..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={novaTaxaForma}
                    onChange={(e) => setNovaTaxaForma(e.target.value)}
                    placeholder="Taxa %"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    step="0.01"
                  />
                  <button
                    onClick={adicionarFormaPagamento}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save All Button */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Finalizar Configuração</h3>
            <p className="text-sm text-gray-600 mt-1">Salve todas as alterações feitas no perfil</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Tudo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};