import React, { useState, useCallback, useEffect } from 'react';
import { TestCase, EvaluationResults, EvaluationStatus, TestSuite, Sandbox } from '../types';
import Button from './common/Button';
import Modal from './common/Modal';
import Gauge from './common/Gauge';
import { analyzeTestFailure } from '../services/geminiService';
import TooltipIcon from './common/TooltipIcon';


interface Phase3Props {
  testSuites: TestSuite[];
  attachedTestSuiteId: string | null;
  onAttachTestSuite: (suiteId: string) => void;
  testRun: TestCase[];
  onUpdateTestRun: (data: TestCase[]) => void;
  isComparing: boolean;
  evaluationResults: EvaluationResults | null;
  evaluationStatus: EvaluationStatus;
  evaluationResultsB: EvaluationResults | null;
  evaluationStatusB: EvaluationStatus;
  systemPrompt: string;
  onUpdateEvaluationResults: (
    resultsA: EvaluationResults | null, 
    statusA: EvaluationStatus, 
    resultsB: EvaluationResults | null, 
    statusB: EvaluationStatus
  ) => void;
  baselineSandbox: Sandbox | undefined;
  onUpdateRegression: (analysis: { improvements: number; regressions: number; unchanged: number } | null, testRun: TestCase[]) => void;
}

const metricTooltips = {
    faithfulness: "Mede o quão factual a resposta é. Uma pontuação alta significa que a resposta se baseia estritamente nas informações do contexto fornecido, sem inventar fatos (alucinar).",
    answerRelevancy: "Avalia o quão relevante a resposta é para a pergunta do usuário. Uma pontuação alta indica que a resposta aborda diretamente o que foi perguntado, sem informações desnecessárias.",
    contextRecall: "Mede se todo o contexto relevante foi recuperado da base de conhecimento. Uma pontuação alta significa que o sistema encontrou todas as informações necessárias para dar uma resposta completa.",
    contextPrecision: "Avalia a proporção de contexto recuperado que é realmente útil. Uma pontuação alta indica que o sistema não trouxe muitos documentos irrelevantes junto com os úteis.",
};

const MOCK_JUSTIFICATIONS = {
    faithfulness: { good: "A resposta usou apenas informações contidas no contexto de referência fornecido.", bad: "A resposta mencionou 'bônus anuais', uma informação que não estava presente no contexto recuperado." },
    answerRelevancy: { good: "A resposta foi direta e abordou completamente a pergunta do usuário.", bad: "A resposta incluiu detalhes irrelevantes sobre a política de home office que não foram solicitados." },
    contextRecall: { good: "Todas as partes relevantes do contexto foram utilizadas para formular a resposta.", bad: "A resposta ignorou a cláusula sobre 'feriados prolongados' presente no contexto." },
    contextPrecision: { good: "O contexto recuperado foi conciso e diretamente relacionado à pergunta.", bad: "O sistema recuperou um documento inteiro quando apenas um parágrafo era necessário." },
};


const Phase3_Evaluation: React.FC<Phase3Props> = (props) => {
    const { 
        testSuites, attachedTestSuiteId, onAttachTestSuite, testRun, onUpdateTestRun,
        isComparing, evaluationResults, evaluationStatus, evaluationResultsB, evaluationStatusB, 
        onUpdateEvaluationResults, systemPrompt, baselineSandbox, onUpdateRegression
    } = props;

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSuiteId, setSelectedSuiteId] = useState('');
    const [isAnalyzingFailure, setIsAnalyzingFailure] = useState(false);
    const [compareWithBaseline, setCompareWithBaseline] = useState(true);
    const [regressionFilter, setRegressionFilter] = useState<'all' | 'improvement' | 'regression'>('all');

    useEffect(() => {
        setSelectedSuiteId(attachedTestSuiteId || '');
    }, [attachedTestSuiteId]);

    const handleRunEvaluation = useCallback(() => {
        if (testRun.length === 0) return;
        setIsEvaluating(true);

        setTimeout(() => {
            let totalScoresA = { faithfulness: 0, answerRelevancy: 0, contextRecall: 0, contextPrecision: 0 };
            
            const datasetWithEvaluation = testRun.map(test => {
                const testPassesA = Math.random() > 0.2; // 80% pass rate
                const generatedA = testPassesA ? test.expectedAnswer : `(Resposta A com falha) ${test.expectedAnswer.substring(0, 50)}...`;

                const evaluationA: EvaluationResults = {
                    faithfulness: { score: testPassesA ? 0.9 + Math.random() * 0.1 : 0.6 + Math.random() * 0.2, justification: testPassesA ? MOCK_JUSTIFICATIONS.faithfulness.good : MOCK_JUSTIFICATIONS.faithfulness.bad },
                    answerRelevancy: { score: testPassesA ? 0.9 + Math.random() * 0.1 : 0.7 + Math.random() * 0.2, justification: testPassesA ? MOCK_JUSTIFICATIONS.answerRelevancy.good : MOCK_JUSTIFICATIONS.answerRelevancy.bad },
                    contextRecall: { score: 0.8 + Math.random() * 0.2, justification: MOCK_JUSTIFICATIONS.contextRecall.good },
                    contextPrecision: { score: 0.85 + Math.random() * 0.15, justification: MOCK_JUSTIFICATIONS.contextPrecision.good },
                };

                totalScoresA.faithfulness += evaluationA.faithfulness.score;
                totalScoresA.answerRelevancy += evaluationA.answerRelevancy.score;
                totalScoresA.contextRecall += evaluationA.contextRecall.score;
                totalScoresA.contextPrecision += evaluationA.contextPrecision.score;
                
                return {
                    ...test,
                    generatedAnswer: generatedA,
                    resultStatus: testPassesA ? 'PASSOU' : 'FALHOU' as ('PASSOU' | 'FALHOU'),
                    failureAnalysis: undefined,
                    evaluation: evaluationA,
                };
            });

            const numTests = testRun.length;
            const avgResultsA: EvaluationResults = {
                faithfulness: { score: totalScoresA.faithfulness / numTests, justification: `Média de ${numTests} testes.` },
                answerRelevancy: { score: totalScoresA.answerRelevancy / numTests, justification: `Média de ${numTests} testes.` },
                contextRecall: { score: totalScoresA.contextRecall / numTests, justification: `Média de ${numTests} testes.` },
                contextPrecision: { score: totalScoresA.contextPrecision / numTests, justification: `Média de ${numTests} testes.` },
            };
            
            const avgScoreA = (avgResultsA.faithfulness.score + avgResultsA.answerRelevancy.score) / 2;
            const statusA: EvaluationStatus = avgScoreA > 0.90 ? "APPROVED" : "REJECTED";

            onUpdateEvaluationResults(avgResultsA, statusA, null, "PENDING"); // Assuming no B for now

            // Regression Analysis
            if (compareWithBaseline && baselineSandbox && baselineSandbox.testRun.length > 0) {
                let improvements = 0;
                let regressions = 0;
                let unchanged = 0;
                
                const baselineTestMap = new Map(baselineSandbox.testRun.map(t => [t.id, t]));

                const finalTestRun = datasetWithEvaluation.map(currentTest => {
                    const baselineTest = baselineTestMap.get(currentTest.id);
                    let regressionStatus: TestCase['regressionStatus'] = undefined;

                    if (baselineTest) {
                        if (baselineTest.resultStatus === 'FALHOU' && currentTest.resultStatus === 'PASSOU') {
                            regressionStatus = 'improvement';
                            improvements++;
                        } else if (baselineTest.resultStatus === 'PASSOU' && currentTest.resultStatus === 'FALHOU') {
                            regressionStatus = 'regression';
                            regressions++;
                        } else {
                            regressionStatus = 'unchanged';
                            unchanged++;
                        }
                    }
                    return { ...currentTest, regressionStatus };
                });
                onUpdateRegression({ improvements, regressions, unchanged }, finalTestRun);
            } else {
                onUpdateRegression(null, datasetWithEvaluation);
            }

            setIsEvaluating(false);
        }, 1500);
    }, [testRun, onUpdateEvaluationResults, isComparing, compareWithBaseline, baselineSandbox, onUpdateRegression]);
    
    const handleRowClick = (testCase: TestCase) => {
        if(testCase.generatedAnswer) {
            setSelectedTest(testCase);
            setIsModalOpen(true);
        }
    }

    const handleAnalyzeFailure = async () => {
        if (!selectedTest || !systemPrompt) return;

        setIsAnalyzingFailure(true);
        try {
            const analysis = await analyzeTestFailure(systemPrompt, selectedTest);
            const updatedTest = { ...selectedTest, failureAnalysis: analysis };
            setSelectedTest(updatedTest);
            const updatedTestRun = testRun.map(tc => tc.id === selectedTest.id ? updatedTest : tc);
            onUpdateTestRun(updatedTestRun);
        } catch (error) {
            console.error("Failure analysis failed:", error);
        } finally {
            setIsAnalyzingFailure(false);
        }
    };

    const statusClasses = { PENDING: "text-yellow-400 bg-yellow-900/50", APPROVED: "text-green-400 bg-green-900/50", REJECTED: "text-red-400 bg-red-900/50" };
    const metricLabels: { [key in keyof EvaluationResults]: string } = { faithfulness: "Fidelidade", answerRelevancy: "Relevância da Resposta", contextRecall: "Abrangência do Contexto", contextPrecision: "Precisão do Contexto" };
    const regressionAnalysis = props.evaluationResults && props.baselineSandbox?.regressionAnalysis;

    const renderEvaluationResults = (title: string, results: EvaluationResults, status: EvaluationStatus) => (
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-bold mb-4 text-center text-gray-300">{title}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Gauge label="Fidelidade" value={results.faithfulness.score} tooltipText={metricTooltips.faithfulness} baselineValue={baselineSandbox?.evaluationResults?.faithfulness.score} />
                <Gauge label="Relevância" value={results.answerRelevancy.score} tooltipText={metricTooltips.answerRelevancy} baselineValue={baselineSandbox?.evaluationResults?.answerRelevancy.score} />
                <Gauge label="Abrangência" value={results.contextRecall.score} tooltipText={metricTooltips.contextRecall} baselineValue={baselineSandbox?.evaluationResults?.contextRecall.score}/>
                <Gauge label="Precisão" value={results.contextPrecision.score} tooltipText={metricTooltips.contextPrecision} baselineValue={baselineSandbox?.evaluationResults?.contextPrecision.score}/>
            </div>
            <div className={`mt-6 p-2 rounded-md text-center font-bold text-sm ${statusClasses[status]}`}>
                Status: {status === 'APPROVED' ? 'APROVADO' : (status === 'REJECTED' ? 'REPROVADO' : 'PENDENTE')}
            </div>
        </div>
    );
    
    const regressionStatusIcons = {
        improvement: <i className="fas fa-arrow-up text-green-400" title="Melhoria"></i>,
        regression: <i className="fas fa-arrow-down text-red-400" title="Regressão"></i>,
        unchanged: <span className="text-gray-600" title="Inalterado">-</span>,
    };

    const filteredTestRun = testRun.filter(tc => regressionFilter === 'all' || tc.regressionStatus === regressionFilter);

    return (
        <>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-dashed border-gray-600 mb-4">
                <h3 className="font-bold mb-3 text-gray-300">Anexar Suíte de Testes</h3>
                <div className="flex items-center gap-2">
                    <select value={selectedSuiteId} onChange={(e) => setSelectedSuiteId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={testSuites.length === 0}>
                        <option value="" disabled>-- Selecione uma suíte --</option>
                        {testSuites.map(suite => (<option key={suite.id} value={suite.id}>{suite.name} ({suite.version}) - {suite.testCases.length} casos</option>))}
                    </select>
                    <Button onClick={() => onAttachTestSuite(selectedSuiteId)} disabled={!selectedSuiteId || selectedSuiteId === attachedTestSuiteId} variant="secondary">Anexar</Button>
                </div>
                {attachedTestSuiteId && <p className="text-xs text-green-400 mt-2">Suíte anexada: {testSuites.find(ts => ts.id === attachedTestSuiteId)?.name}</p>}
            </div>

            {baselineSandbox && testRun.length > 0 && (
                <div className="flex items-center justify-start gap-2 mb-4 p-3 bg-gray-900/50 rounded-md">
                    <input type="checkbox" id="compare-baseline" checked={compareWithBaseline} onChange={(e) => setCompareWithBaseline(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600" />
                    <label htmlFor="compare-baseline" className="text-sm font-medium text-gray-300">Comparar com a Baseline "{baselineSandbox.name}"</label>
                </div>
            )}
            
            {regressionAnalysis && (
                <div className="p-4 bg-gray-900/50 rounded-lg mb-4 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-sm text-gray-400">Melhorias</p><p className="text-2xl font-bold text-green-400">{regressionAnalysis.improvements}</p></div>
                    <div><p className="text-sm text-gray-400">Regressões</p><p className="text-2xl font-bold text-red-400">{regressionAnalysis.regressions}</p></div>
                    <div><p className="text-sm text-gray-400">Inalterados</p><p className="text-2xl font-bold text-gray-500">{regressionAnalysis.unchanged}</p></div>
                </div>
            )}

            {testRun.length > 0 && (
                <>
                    {regressionAnalysis && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-400">Filtrar:</span>
                            <Button variant={regressionFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setRegressionFilter('all')} className="!text-xs !py-1 !px-2">Todos</Button>
                            <Button variant={regressionFilter === 'regression' ? 'primary' : 'secondary'} onClick={() => setRegressionFilter('regression')} className="!text-xs !py-1 !px-2">Regressões</Button>
                            <Button variant={regressionFilter === 'improvement' ? 'primary' : 'secondary'} onClick={() => setRegressionFilter('improvement')} className="!text-xs !py-1 !px-2">Melhorias</Button>
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-2 rounded-md border border-gray-700 mb-4">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-700 sticky top-0"><tr>
                                {regressionAnalysis && <th className="px-2 py-2"></th>}
                                <th className="px-4 py-2">ID</th><th className="px-4 py-2">Pergunta</th><th className="px-4 py-2">Status</th>
                            </tr></thead>
                            <tbody>{filteredTestRun.map((item) => (<tr key={item.id} className={`border-b border-gray-700 ${item.generatedAnswer ? 'hover:bg-gray-800 cursor-pointer' : ''}`} onClick={() => handleRowClick(item)}>
                                {regressionAnalysis && <td className="px-2 py-2 text-center">{item.regressionStatus && regressionStatusIcons[item.regressionStatus]}</td>}
                                <td className="px-4 py-2 font-mono">{item.id}</td>
                                <td className="px-4 py-2">{item.question}</td>
                                <td className="px-4 py-2">{item.resultStatus ? (<span className={`px-2 py-1 text-xs font-bold rounded-full ${item.resultStatus === 'PASSOU' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{item.resultStatus}</span>) : (<span className="text-gray-500">Pendente</span>)}</td>
                            </tr>))}</tbody>
                        </table>
                    </div>
                </>
            )}

            <Button onClick={handleRunEvaluation} disabled={testRun.length === 0 || isEvaluating} className="w-full mb-4">{isEvaluating ? 'Avaliando...' : 'Executar Avaliação'}</Button>
            
            <div className={`grid grid-cols-1 ${isComparing ? 'lg:grid-cols-2 gap-4' : ''}`}>
                {evaluationResults && renderEvaluationResults(isComparing ? "Resultados Prompt A" : "Resultados da Avaliação", evaluationResults, evaluationStatus)}
                {isComparing && evaluationResultsB && renderEvaluationResults("Resultados Prompt B", evaluationResultsB, evaluationStatusB)}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Detalhes do Teste ID: ${selectedTest?.id}`}>
                {selectedTest && (
                    <div className="space-y-4 text-gray-300">
                        <div><h4 className="font-bold text-gray-400">Pergunta:</h4><p className="p-2 bg-gray-900/50 rounded-md">{selectedTest.question}</p></div>
                        <div><h4 className="font-bold text-gray-400">Resposta Esperada (Ground Truth):</h4><p className="p-2 bg-green-900/30 rounded-md border border-green-700">{selectedTest.expectedAnswer}</p></div>
                        <div><h4 className="font-bold text-gray-400">Resposta Gerada {isComparing ? '(Prompt A)' : ''}:</h4><p className="p-2 bg-cyan-900/30 rounded-md border border-cyan-700">{selectedTest.generatedAnswer}</p></div>
                        {selectedTest.evaluation && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="font-bold text-gray-400 mb-2">Análise do LLM Avaliador</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(Object.keys(selectedTest.evaluation) as Array<keyof EvaluationResults>).map(key => {
                                        const metric = selectedTest.evaluation![key];
                                        const getScoreColor = (score: number) => score > 0.9 ? 'text-green-400' : score > 0.8 ? 'text-yellow-400' : 'text-red-400';
                                        return (
                                            <div key={key} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center"><p className="font-semibold text-cyan-400">{metricLabels[key]}</p><TooltipIcon text={metricTooltips[key as keyof typeof metricTooltips]} /></div>
                                                    <p className={`font-bold text-lg ${getScoreColor(metric.score)}`}>{(metric.score * 100).toFixed(0)}%</p>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">{metric.justification}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div><h4 className="font-bold text-gray-400">Status do Teste:</h4><p className={`p-2 rounded-md font-bold ${selectedTest.resultStatus === 'PASSOU' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{selectedTest.resultStatus}</p></div>
                        {selectedTest.resultStatus === 'FALHOU' && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="font-bold text-gray-400 mb-2">Análise de Causa Raiz</h4>
                                {selectedTest.failureAnalysis ? (
                                    <div className="p-3 bg-gray-900/50 rounded-lg space-y-2 border border-gray-700">
                                        <div><p className="text-sm font-semibold text-cyan-400">Causa Raiz:</p><p className="font-mono text-yellow-300 bg-gray-800 px-2 py-1 rounded-md inline-block text-sm">{selectedTest.failureAnalysis.rootCause}</p></div>
                                        <div><p className="text-sm font-semibold text-cyan-400">Justificativa:</p><p className="text-sm">{selectedTest.failureAnalysis.justification}</p></div>
                                        <div><p className="text-sm font-semibold text-cyan-400">Sugestão de Melhoria:</p><p className="p-2 bg-gray-800 rounded-md border border-gray-600 text-sm">{selectedTest.failureAnalysis.suggestion}</p></div>
                                    </div>
                                ) : (
                                    <Button onClick={handleAnalyzeFailure} disabled={isAnalyzingFailure} className="w-full">
                                        {isAnalyzingFailure ? (<><i className="fas fa-spinner fa-spin mr-2"></i> Analisando...</>) : (<><i className="fas fa-magic mr-2"></i> Analisar Falha com IA</>)}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Phase3_Evaluation;