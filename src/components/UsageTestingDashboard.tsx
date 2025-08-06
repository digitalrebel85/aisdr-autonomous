'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface UsageData {
  leads: number;
  emails: number;
  subscription: {
    plan: {
      name: string;
      limits: {
        prospects_per_month: number;
        emails_per_month: number;
      };
    };
  };
}

interface TokenUsage {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  by_operation: Record<string, any>;
  by_model: Record<string, any>;
}

export default function UsageTestingDashboard() {
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test form states
  const [leadCount, setLeadCount] = useState(1);
  const [emailCount, setEmailCount] = useState(1);
  const [scenario, setScenario] = useState('light');
  
  // Token tracking form states
  const [operationType, setOperationType] = useState('email_generation');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4');
  const [inputTokens, setInputTokens] = useState(100);
  const [outputTokens, setOutputTokens] = useState(50);

  useEffect(() => {
    loadCurrentUsage();
    loadTokenUsage();
  }, []);

  const loadCurrentUsage = async () => {
    try {
      const response = await fetch('/api/test-usage?action=current-usage');
      const data = await response.json();
      setCurrentUsage(data.usage);
    } catch (error) {
      console.error('Error loading current usage:', error);
    }
  };

  const loadTokenUsage = async () => {
    try {
      const response = await fetch('/api/test-usage?action=token-usage&days=30');
      const data = await response.json();
      setTokenUsage(data.tokenUsage);
    } catch (error) {
      console.error('Error loading token usage:', error);
    }
  };

  const testAction = async (action: string, params: any = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });
      const data = await response.json();
      
      setTestResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        action,
        params,
        ...data
      }, ...prev.slice(0, 9)]); // Keep last 10 results

      // Refresh usage data
      await loadCurrentUsage();
      if (action === 'track-tokens') {
        await loadTokenUsage();
      }
    } catch (error) {
      console.error('Test action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage & Token Testing Dashboard</h2>
        <Button onClick={() => { loadCurrentUsage(); loadTokenUsage(); }}>
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="current-usage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current-usage">Current Usage</TabsTrigger>
          <TabsTrigger value="usage-testing">Usage Testing</TabsTrigger>
          <TabsTrigger value="token-tracking">Token Tracking</TabsTrigger>
          <TabsTrigger value="test-results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="current-usage" className="space-y-4">
          {currentUsage && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Usage</CardTitle>
                  <CardDescription>Monthly prospect tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current: {currentUsage.leads}</span>
                    <span>Limit: {currentUsage.subscription?.plan?.limits?.prospects_per_month === -1 ? 'Unlimited' : currentUsage.subscription?.plan?.limits?.prospects_per_month}</span>
                  </div>
                  {currentUsage.subscription?.plan?.limits?.prospects_per_month !== -1 && (
                    <Progress 
                      value={calculateProgress(currentUsage.leads, currentUsage.subscription?.plan?.limits?.prospects_per_month)} 
                      className="w-full"
                    />
                  )}
                  <Badge variant={currentUsage.leads > (currentUsage.subscription?.plan?.limits?.prospects_per_month * 0.8) ? 'destructive' : 'secondary'}>
                    {currentUsage.subscription?.plan?.name} Plan
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Usage</CardTitle>
                  <CardDescription>Monthly email sending</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current: {currentUsage.emails}</span>
                    <span>Limit: {currentUsage.subscription?.plan?.limits?.emails_per_month === -1 ? 'Unlimited' : currentUsage.subscription?.plan?.limits?.emails_per_month}</span>
                  </div>
                  {currentUsage.subscription?.plan?.limits?.emails_per_month !== -1 && (
                    <Progress 
                      value={calculateProgress(currentUsage.emails, currentUsage.subscription?.plan?.limits?.emails_per_month)} 
                      className="w-full"
                    />
                  )}
                  <Badge variant={currentUsage.emails > (currentUsage.subscription?.plan?.limits?.emails_per_month * 0.8) ? 'destructive' : 'secondary'}>
                    {currentUsage.subscription?.plan?.name} Plan
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {tokenUsage && (
            <Card>
              <CardHeader>
                <CardTitle>AI Token Usage (Last 30 Days)</CardTitle>
                <CardDescription>Token consumption and costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tokenUsage.total_tokens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tokenUsage.input_tokens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Input Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tokenUsage.output_tokens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Output Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(tokenUsage.total_cost)}</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>

                {Object.keys(tokenUsage.by_operation).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">By Operation</h4>
                    <div className="space-y-2">
                      {Object.entries(tokenUsage.by_operation).map(([operation, data]: [string, any]) => (
                        <div key={operation} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="capitalize">{operation.replace('_', ' ')}</span>
                          <div className="text-right">
                            <div>{data.total_tokens.toLocaleString()} tokens</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(data.cost_usd)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage-testing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Lead Usage</CardTitle>
                <CardDescription>Simulate adding leads to test limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-count">Number of leads</Label>
                  <Input
                    id="lead-count"
                    type="number"
                    value={leadCount}
                    onChange={(e) => setLeadCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="1000"
                  />
                </div>
                <Button 
                  onClick={() => testAction('test-leads', { count: leadCount })}
                  disabled={loading}
                  className="w-full"
                >
                  Test Lead Usage
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Email Usage</CardTitle>
                <CardDescription>Simulate sending emails to test limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-count">Number of emails</Label>
                  <Input
                    id="email-count"
                    type="number"
                    value={emailCount}
                    onChange={(e) => setEmailCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="1000"
                  />
                </div>
                <Button 
                  onClick={() => testAction('test-emails', { count: emailCount })}
                  disabled={loading}
                  className="w-full"
                >
                  Test Email Usage
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Scenarios</CardTitle>
              <CardDescription>Test different usage patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario">Scenario</Label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Usage (10 leads, 5 emails)</SelectItem>
                    <SelectItem value="heavy">Heavy Usage (100 leads, 50 emails)</SelectItem>
                    <SelectItem value="limit_test">Limit Test (90% of plan limits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => testAction('simulate-scenario', { scenario })}
                disabled={loading}
                className="w-full"
              >
                Run Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token-tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Track Token Usage</CardTitle>
              <CardDescription>Manually track AI token consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operation">Operation Type</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_generation">Email Generation</SelectItem>
                      <SelectItem value="reply_analysis">Reply Analysis</SelectItem>
                      <SelectItem value="lead_enrichment">Lead Enrichment</SelectItem>
                      <SelectItem value="follow_up_generation">Follow-up Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., gpt-4, deepseek-chat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input-tokens">Input Tokens</Label>
                  <Input
                    id="input-tokens"
                    type="number"
                    value={inputTokens}
                    onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-tokens">Output Tokens</Label>
                  <Input
                    id="output-tokens"
                    type="number"
                    value={outputTokens}
                    onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <div className="text-lg font-semibold">
                    {formatCurrency(0.001)} {/* You'd calculate this based on the token tracker */}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => testAction('track-tokens', {
                  operationType,
                  provider,
                  model,
                  inputTokens,
                  outputTokens,
                  metadata: { test: true }
                })}
                disabled={loading}
                className="w-full"
              >
                Track Token Usage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Recent test actions and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No test results yet. Run some tests to see results here.</p>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <Alert key={index} className={result.result?.success !== false ? '' : 'border-destructive'}>
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong>{result.timestamp}</strong> - {result.action}
                            {result.params && Object.keys(result.params).length > 0 && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Params: {JSON.stringify(result.params)}
                              </div>
                            )}
                          </div>
                          <Badge variant={result.result?.success !== false ? 'default' : 'destructive'}>
                            {result.result?.success !== false ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        {result.result && (
                          <div className="mt-2 text-sm">
                            {result.result.message && <div>{result.result.message}</div>}
                            {result.result.usage && (
                              <div>Usage: {result.result.usage.current}/{result.result.usage.limit === -1 ? '∞' : result.result.usage.limit}</div>
                            )}
                            {result.cost && <div>Cost: {formatCurrency(result.cost)}</div>}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
