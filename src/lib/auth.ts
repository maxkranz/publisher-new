import { supabase } from './supabase';

export async function signUp(email: string, password: string, name: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError };

  // Create profile after successful signup
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, name, email }]);

    if (profileError) return { error: profileError };
  }

  return { data: authData, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function updateProfile(userId: string, updates: { name?: string; email?: string }) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (profileError) return { error: profileError };

  // If email is being updated, update auth email as well
  if (updates.email) {
    const { error: authError } = await supabase.auth.updateUser({
      email: updates.email,
    });
    if (authError) return { error: authError };
  }

  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

export async function deleteAccount(userId: string) {
  // Delete user's projects first
  const { error: projectsError } = await supabase
    .from('projects')
    .delete()
    .eq('user_id', userId);

  if (projectsError) return { error: projectsError };

  // Delete user's profile
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) return { error: profileError };

  // Finally, delete the user's auth account
  // Note: This would typically be handled by a backend function in production
  return { error: null };
}