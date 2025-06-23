// Utilitário para promover um usuário a administrador
export const makeAdmin = async (email) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao promover usuário');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    throw error;
  }
};