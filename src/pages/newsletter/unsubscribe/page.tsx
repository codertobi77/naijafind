import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { useTranslation } from 'react-i18next';
import { api } from '@convex/_generated/api';
import { Header } from '../../../components/base';

type UnsubscribeState = 'idle' | 'processing' | 'success' | 'not_found' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Page de désinscription newsletter (/newsletter/unsubscribe) :
 * - lien personnalisé `?email=…` (emails transactionnels) → désinscription
 *   automatique à l'arrivée ;
 * - lien générique (pied de page des campagnes batch, même HTML pour tous)
 *   → l'utilisateur saisit son adresse dans le formulaire.
 *
 * La mutation unsubscribeFromNewsletter est idempotente (statut déjà
 * « unsubscribed » → succès) et renvoie success:false si l'adresse
 * n'existe pas dans newsletter_subscriptions.
 */
export default function NewsletterUnsubscribePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const unsubscribeMutation = useMutation(api.emails.unsubscribeFromNewsletter);

  const [state, setState] = useState<UnsubscribeState>(
    emailParam ? 'processing' : 'idle'
  );
  const [emailInput, setEmailInput] = useState(emailParam ?? '');
  const [inputError, setInputError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const doUnsubscribe = async (email: string) => {
    setState('processing');
    try {
      const result = await unsubscribeMutation({ email });
      if (result?.success) {
        setState('success');
      } else if (result?.message?.includes('not found')) {
        setState('not_found');
      } else {
        setState('error');
      }
    } catch (err) {
      console.error('Newsletter unsubscribe failed:', err);
      setState('error');
    }
  };

  // Désinscription automatique quand l'email est fourni dans l'URL.
  useEffect(() => {
    if (!emailParam || autoTriggered.current) return;
    if (!EMAIL_RE.test(emailParam)) {
      setState('idle');
      return;
    }
    autoTriggered.current = true;
    void doUnsubscribe(emailParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setInputError(t('newsletter_unsubscribe.invalid_email'));
      return;
    }
    setInputError(null);
    void doUnsubscribe(email);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-12 sm:px-6">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {state === 'processing' ? (
            <>
              <i className="ri-loader-4-line animate-spin text-4xl text-green-600" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                {t('newsletter_unsubscribe.processing_title')}
              </h1>
            </>
          ) : state === 'success' ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <i className="ri-check-line text-3xl text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('newsletter_unsubscribe.success_title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('newsletter_unsubscribe.success_message')}
              </p>
            </>
          ) : state === 'not_found' ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <i className="ri-question-line text-3xl text-orange-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('newsletter_unsubscribe.not_found_title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('newsletter_unsubscribe.not_found_message')}
              </p>
            </>
          ) : state === 'error' ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <i className="ri-error-warning-line text-3xl text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('newsletter_unsubscribe.error_title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('newsletter_unsubscribe.error_message')}
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <i className="ri-mail-unsubscribe-line text-3xl text-green-600" />
              </div>
              <h1 className="text-center text-xl font-bold text-gray-900">
                {t('newsletter_unsubscribe.title')}
              </h1>
              <p className="mt-2 text-center text-sm text-gray-600">
                {t('newsletter_unsubscribe.description')}
              </p>

              <label
                htmlFor="unsubscribe-email"
                className="mt-6 block text-sm font-medium text-gray-700"
              >
                {t('newsletter_unsubscribe.email_label')}
              </label>
              <input
                id="unsubscribe-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="vous@exemple.com"
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {inputError && (
                <p className="mt-1.5 text-xs text-red-600">{inputError}</p>
              )}

              <button
                type="submit"
                className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                {t('newsletter_unsubscribe.submit')}
              </button>
            </form>
          )}

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-green-600 transition-colors hover:text-green-700"
          >
            <i className="ri-arrow-left-line" />
            {t('common.return_home')}
          </Link>
        </div>
      </main>
    </div>
  );
}
