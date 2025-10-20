import { supabase } from './supabase';

/**
 * Create an analytics event
 * Replaces: base44.entities.AnalyticsEvents.create()
 */
export async function createAnalyticsEvent(eventData) {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        ...eventData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating analytics event:', error);
      // Don't throw - analytics failures shouldn't break the app
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createAnalyticsEvent:', error);
    return null;
  }
}

/**
 * Filter analytics events
 * Replaces: base44.entities.AnalyticsEvents.filter()
 */
export async function filterAnalyticsEvents(filters = {}) {
  try {
    let query = supabase.from('analytics_events').select('*');

    if (filters.user_email) {
      query = query.eq('user_email', filters.user_email);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.created_date && filters.created_date.$gte) {
      query = query.gte('created_at', filters.created_date.$gte);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error filtering analytics events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in filterAnalyticsEvents:', error);
    return [];
  }
}
