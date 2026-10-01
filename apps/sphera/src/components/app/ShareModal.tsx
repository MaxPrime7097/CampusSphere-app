import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ShareModal({ 
  isOpen, 
  setIsOpen, 
  url, 
  title,
  description,
}: { 
  isOpen: boolean; 
  setIsOpen: (o: boolean) => void; 
  url: string;
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation('study');
  const [copied, setCopied] = useState(false);

  const resolvedTitle = title || t('modals.share.title');
  const resolvedDesc = description || t('modals.share.description');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copie échouée", e);
    }
  };

  const socialLinks = [
    { 
      name: 'WhatsApp', 
      icon: (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>, 
      url: `https://wa.me/?text=${encodeURIComponent(url)}`, 
      color: '#25D366' 
    },
    { 
      name: 'LinkedIn', 
      icon: (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, 
      color: '#0077B5' 
    },
    { 
      name: 'Facebook', 
      icon: (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 
      color: '#1877F2' 
    },
    { 
      name: 'X', 
      icon: (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, 
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, 
      color: '#000000' 
    },
    { 
      name: 'Reddit', 
      icon: (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.275-1.84.734-1.996-1.328-4.707-2.193-7.755-2.296l1.583-7.5 5.375 1.134c.022 1.332 1.115 2.393 2.456 2.393 1.353 0 2.453-1.101 2.453-2.454s-1.1-2.454-2.453-2.454c-1.012 0-1.884.61-2.25 1.481l-5.885-1.24a.499.499 0 00-.585.39l-1.748 8.283c-3.13.064-5.922.92-7.981 2.261-.478-.47-1.14-.755-1.87-.755-1.464 0-2.657 1.186-2.657 2.645 0 .961.523 1.787 1.282 2.235-.027.202-.04.408-.04.616 0 4.167 5.485 7.551 12.25 7.551 6.764 0 12.248-3.384 12.248-7.551 0-.203-.013-.404-.037-.601.777-.442 1.314-1.282 1.314-2.258zm-19.866 2.49c1.077 0 1.95.874 1.95 1.953 0 1.078-.873 1.953-1.95 1.953-1.077 0-1.95-.875-1.95-1.953 0-1.079.873-1.953 1.95-1.953zm5.727 6.136c-1.895 1.428-5.38.794-5.467.777-.184-.035-.3-.217-.266-.4.035-.183.217-.3.4-.266.012.003 3.018.57 4.545-.58a.498.498 0 01.597.794c-.58.435-1.28.675-1.81.769zm1.378-2.647a1.95 1.95 0 01-1.952-1.952c0-1.078.875-1.952 1.952-1.952 1.076 0 1.951.874 1.951 1.952 0 1.077-.875 1.952-1.951 1.952zm5.73 0a1.95 1.95 0 01-1.952-1.952c0-1.078.875-1.952 1.952-1.952 1.076 0 1.951.874 1.951 1.952 0 1.077-.875 1.952-1.951 1.952zm2.146-2.585c-1.078 0-1.951-.874-1.951-1.953 0-1.078.873-1.952 1.951-1.952 1.077 0 1.95.874 1.95 1.952 0 1.079-.873 1.953-1.95 1.953z"/></svg>, 
      url: `https://reddit.com/submit?url=${encodeURIComponent(url)}`, 
      color: '#FF4500' 
    }
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-sphera-surface-2 border border-sphera-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col gap-5 text-white">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold">{resolvedTitle}</Dialog.Title>
            <Dialog.Close className="text-sphera-text-muted hover:text-white transition-colors bg-sphera-surface hover:bg-sphera-border p-2 rounded-full">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-center bg-sphera-bg border border-sphera-border rounded-xl p-1 pr-1.5 overflow-hidden">
            <input 
              type="text" 
              readOnly 
              value={url} 
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-white/80 selection:bg-sphera-green/30"
              onClick={(e) => e.currentTarget.select()}
            />
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${copied ? 'bg-sphera-green text-black' : 'bg-sphera-surface hover:bg-sphera-border text-white'}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('modals.share.copied') : t('modals.share.copy')}
            </button>
          </div>

          <Dialog.Description className="text-sm text-sphera-text-muted leading-relaxed flex gap-3">
            <span className="shrink-0 mt-0.5 text-lg">ⓘ</span>
            <span>{resolvedDesc}</span>
          </Dialog.Description>

          <div className="flex items-center justify-around mt-2 pt-5 border-t border-sphera-border/50">
            {socialLinks.map((social) => (
              <a 
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:-translate-y-1 group-hover:scale-105"
                  style={{ backgroundColor: social.color }}
                >
                  <social.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-sphera-text-muted group-hover:text-white transition-colors">
                  {social.name}
                </span>
              </a>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
