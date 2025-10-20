import { supabase } from './supabase';

/**
 * Create a report
 * Replaces: base44.entities.Report.create()
 */
export async function createReport(reportData) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...reportData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createReport:', error);
    throw error;
  }
}
