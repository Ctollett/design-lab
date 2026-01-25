"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import AI from '../../images/noun-ai-7315703.svg'

function SpinningText({ text, active }: { text: string; active: boolean }) {
  const [displayedChars, setDisplayedChars] = useState<string[]>(text.split(''))
  const [phase, setPhase] = useState<'idle' | 'ramping-up' | 'spinning' | 'ramping-down' | 'settled'>('idle')
  const activeIndicesRef = useRef<Set<number>>(new Set())

  const randomLetter = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz'
    const randomIndex = Math.floor(Math.random() * characters.length)
    return characters.charAt(randomIndex)
  }


useEffect(() => {
  if (active) {
    setPhase('ramping-up')
  } else {
    if (phase === 'spinning' || phase === 'ramping-up') {
      setPhase('ramping-down')
    }
  }
}, [active, phase])

  
useEffect(() => {
  const timeouts: NodeJS.Timeout[] = []
  
  if (phase === 'ramping-up') {
    for (let i = 0; i < text.length; i++) {
      const timeout = setTimeout(() => {
        activeIndicesRef.current = new Set([...activeIndicesRef.current, i])
      }, i * 50)
      timeouts.push(timeout)
    }
  } else if (phase === 'ramping-down') {

    const allIndices = new Set(Array.from({length: text.length}, (_, i) => i))
    activeIndicesRef.current = allIndices
    
    setDisplayedChars(text.split('').map(() => randomLetter()))

    for (let i = 0; i < text.length; i++) {
      const timeout = setTimeout(() => {
      const newSet = new Set([...activeIndicesRef.current])
      newSet.delete(i)
      activeIndicesRef.current = newSet
   
        if (i === text.length - 1) {
          setPhase('settled')
        }
      }, i * 50)
      timeouts.push(timeout)
    }
  }

  return () => timeouts.forEach(t => clearTimeout(t))
}, [phase, text.length])


useEffect(() => {
  if (text && (phase === 'idle' || phase === 'settled')) {
    setDisplayedChars(text.split(''))
  }
}, [text, phase])




  useEffect(() => {
    if (text && (phase === 'ramping-up' || phase === 'ramping-down')) {
      const intervalId = setInterval(() => {
        setDisplayedChars(prev => 
          prev.map((char, index) => 
          activeIndicesRef.current.has(index) ? randomLetter() : text[index]
          )
        )
      }, 50)

      return () => clearInterval(intervalId)
    }
  }, [text, phase])

  


  return (
    <span>
      {displayedChars.map((char, i) => (
        <span key={i}>{char}</span>
      ))}
    </span>
  )
}

type Status = 'idle' | 'loading' | 'preview';

export default function InlineAutoSuggest() {
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [status, setStatus] = useState<Status>('idle')
  const [improvedText, setImprovedText] = useState('')
  const [selectedText, setSelectedText] = useState('')

  const handleAIButton = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedText.length > 0) {
      setStatus('loading')
      console.log("loading")

      try {
        const response = await fetch('/api/ai/improve-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: selectedText }),
        });

        if (!response.ok) {
          throw new Error('Failed to improve text');
        }

        const data = await response.json();
        const improvedText = data.improvedText;

        setImprovedText(improvedText)
        console.log("improved text", improvedText)
        console.log('preview')

        setStatus('preview')
      } catch (error) {
        console.error('Error improving text:', error);
        setStatus('idle');
      }
    }
  }

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (selection && selection.toString().length > 0 && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionRect(rect);
        setSelectedText(selection.toString())
      } else {
        setSelectionRect(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#f5f5f4]">
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col gap-4 mb-8">
            <div className="text-2xl text-red-500 bg-yellow-200 p-4">
              <SpinningText
                text={status === 'preview' ? improvedText : (selectedText || "test")}
                active={status === 'loading'}
              />
            </div>

            <AnimatePresence>
              {selectionRect && (
                <motion.div
                  initial={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  onClick={handleAIButton}
                  className="bg-neutral-800 text-white p-4 rounded-xl w-[48px] h-[48px] items-center flex justify-center text-sm font-medium shadow-lg cursor-pointer"
                  style={{
                    position: 'fixed',
                    top: selectionRect.top - 65,
                    left: selectionRect.left,
                  }}
                >
                  <AI style={{ width: 32, height: 32 }} />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="outline-none text-xl text-neutral-800"
              contentEditable="true"
              data-placeholder="Enter text here..."
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
