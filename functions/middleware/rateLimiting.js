import { createClient } from '@supabase/supabase-js';

// MVP Configuration - Everyone gets high limits
const RATE_LIMITS = {
  free: 500,  // Generous MVP limits for all users
  paid: 500   // Same for now, ready to differentiate later
};

export async function checkRateLimit(context, userId) {
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get or create user usage record
  let { data: usage, error } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Create new user record
    const { data: newUsage, error: createError } = await supabase
      .from('user_usage')
      .insert({ user_id: userId })
      .select()
      .single();
    
    if (createError) throw createError;
    usage = newUsage;
  } else if (error) {
    throw error;
  }

  // Check if we need to reset daily count
  const today = new Date().toISOString().split('T')[0];
  if (usage.last_reset_date !== today) {
    const { data: resetUsage, error: resetError } = await supabase
      .from('user_usage')
      .update({
        messages_today: 0,
        last_reset_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (resetError) throw resetError;
    usage = resetUsage;
  }

  const limit = RATE_LIMITS[usage.tier] || RATE_LIMITS.free;
  const remaining = limit - usage.messages_today;

  return {
    usage: usage.messages_today,
    limit,
    remaining,
    tier: usage.tier,
    canProceed: remaining > 0
  };
}

export async function incrementUsage(context, userId) {
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from('user_usage')
    .update({
      messages_today: supabase.raw('messages_today + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) throw error;
}