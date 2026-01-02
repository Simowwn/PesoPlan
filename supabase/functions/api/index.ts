import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');
  
  console.log(`[API] ${req.method} ${path}`);

  try {
    // Health check endpoint
    if (path === '/health' || path === '/' || path === '') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'Budget API is running',
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /health - Health check',
            'GET /info - API information',
            'POST /calculate-budget - Calculate budget allocation',
            'POST /validate-expense - Validate expense data',
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // API info endpoint
    if (path === '/info' && req.method === 'GET') {
      return new Response(
        JSON.stringify({
          name: 'Budget Tracker API',
          version: '1.0.0',
          description: 'API for managing personal budget, income, and expenses',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate budget allocation
    if (path === '/calculate-budget' && req.method === 'POST') {
      const body = await req.json();
      const { totalIncome, needsPercentage = 50, wantsPercentage = 30, savingsPercentage = 20 } = body;

      if (!totalIncome || typeof totalIncome !== 'number' || totalIncome <= 0) {
        return new Response(
          JSON.stringify({ error: 'Valid totalIncome (positive number) is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const total = needsPercentage + wantsPercentage + savingsPercentage;
      if (total !== 100) {
        return new Response(
          JSON.stringify({ error: `Percentages must sum to 100, got ${total}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const allocation = {
        totalIncome,
        needs: {
          percentage: needsPercentage,
          amount: (totalIncome * needsPercentage) / 100,
        },
        wants: {
          percentage: wantsPercentage,
          amount: (totalIncome * wantsPercentage) / 100,
        },
        savings: {
          percentage: savingsPercentage,
          amount: (totalIncome * savingsPercentage) / 100,
        },
      };

      console.log('[API] Budget calculated:', allocation);
      return new Response(
        JSON.stringify(allocation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expense data
    if (path === '/validate-expense' && req.method === 'POST') {
      const body = await req.json();
      const { name, amount, category, subcategory } = body;

      const errors: string[] = [];
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('name is required and must be a non-empty string');
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        errors.push('amount must be a positive number');
      }
      
      if (!category || !['needs', 'wants'].includes(category)) {
        errors.push('category must be either "needs" or "wants"');
      }
      
      const validSubcategories = ['food', 'transportation', 'clothes', 'toys', 'gadgets', 'travel', 'utilities', 'rent', 'entertainment', 'other'];
      if (!subcategory || !validSubcategories.includes(subcategory)) {
        errors.push(`subcategory must be one of: ${validSubcategories.join(', ')}`);
      }

      if (errors.length > 0) {
        return new Response(
          JSON.stringify({ valid: false, errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, message: 'Expense data is valid' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
