import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/layout/ProjectLayout';
import { useProject } from '../hooks/useProjects';
import { useAhpContext } from '../hooks/useAhpContext';
import { sendChatMessage, hasApiKey } from '../lib/aiService';
import { AI_PROMPT_TEMPLATES, SYSTEM_PROMPT_BASE } from '../lib/aiPromptTemplates';
import AiProviderSelector from '../components/ai/AiProviderSelector';
import AiApiKeyModal from '../components/ai/AiApiKeyModal';
import AiChatMessage from '../components/ai/AiChatMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import common from '../styles/common.module.css';
import styles from './AiAnalysisPage.module.css';

const MAX_MESSAGES_TO_API = 10;

export default function AiAnalysisPage() {
  const { id } = useParams();
  const { currentProject, loading: projLoading } = useProject(id);
  const { contextText, loading: ctxLoading, hasData } = useAhpContext(id);

  const [provider, setProvider] = useState('openai');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Build system prompt with AHP context
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${contextText}`;

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || streaming) return;

    if (!hasApiKey(provider)) {
      setShowKeyModal(true);
      return;
    }

    setError('');
    setInput('');
    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);

    // Prepare messages for API (limit to recent)
    const allMsgs = [...messages, userMsg];
    const apiMsgs = allMsgs.length > MAX_MESSAGES_TO_API
      ? allMsgs.slice(-MAX_MESSAGES_TO_API)
      : allMsgs;

    // Add assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const fullText = await sendChatMessage(
        provider,
        apiMsgs,
        systemPrompt,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        }
      );

      // Final update with full text (in case streaming missed something)
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullText };
        return updated;
      });
    } catch (err) {
      setError(err.message);
      // Remove empty assistant message
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === 'assistant' && !updated[updated.length - 1]?.content) {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, provider, messages, systemPrompt]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateClick = (template) => {
    handleSend(template.prompt);
  };

  const loading = projLoading || ctxLoading;

  if (loading) {
    return <ProjectLayout><LoadingSpinner message="데이터 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout projectName={currentProject?.name}>
      <h1 className={common.pageTitle}>AI 분석도구 활용</h1>

      <div className={styles.container}>
        {/* Header: Provider selector */}
        <AiProviderSelector
          provider={provider}
          onChange={setProvider}
          onSettingsClick={() => setShowKeyModal(true)}
        />

        {/* Chat area */}
        <div className={styles.chatArea}>
          {!hasData && messages.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📋</p>
              <p className={styles.emptyText}>
                평가를 완료한 후 AI 분석을 이용할 수 있습니다.
              </p>
              <p className={styles.emptySubtext}>
                집계 결과 데이터가 없으면 AI가 분석할 내용이 없습니다.
              </p>
            </div>
          )}

          {hasData && messages.length === 0 && (
            <div className={styles.templateSection}>
              <p className={styles.templateTitle}>분석 템플릿을 선택하거나 자유롭게 질문하세요</p>
              <div className={styles.templateGrid}>
                {AI_PROMPT_TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    className={styles.templateCard}
                    onClick={() => handleTemplateClick(t)}
                    disabled={streaming}
                  >
                    <span className={styles.templateIcon}>{t.icon}</span>
                    <span className={styles.templateLabel}>{t.label}</span>
                    <span className={styles.templateDesc}>{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <AiChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {error && (
            <div className={styles.error}>
              ⚠ {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className={styles.inputArea}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasData ? 'AHP 결과에 대해 질문하세요... (Enter로 전송, Shift+Enter로 줄바꿈)' : '평가 데이터가 필요합니다'}
            disabled={streaming || !hasData}
            rows={2}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={streaming || !input.trim() || !hasData}
          >
            {streaming ? '⏳' : '전송'}
          </button>
        </div>
      </div>

      <AiApiKeyModal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} />
    </ProjectLayout>
  );
}
