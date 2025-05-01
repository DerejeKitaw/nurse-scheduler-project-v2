import * as React from "react";

type HookReturn = {
  isListening : boolean;
  start       : () => void;          // click mic → start listening
  stop        : () => void;          // not used yet, but handy
  interimText : string;              // live caption
};

export const useSpeechRecognition = (
  /** push interim / final text up to the parent */
  setText : React.Dispatch<React.SetStateAction<string>>
): HookReturn => {

  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>();

  /* create the Web-Speech object once */
  React.useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = false;

    recog.onstart = () => setIsListening(true);
    recog.onend   = () => setIsListening(false);

    recog.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          setText(txt);        // <- just DROP the text in the input
        } else {
          interim += txt;
          setText(interim);    // live caption
        }
      }
    };

    recognitionRef.current = recog;
  }, [setText]);

  return {
    isListening,
    start: () => recognitionRef.current?.start(),
    stop : () => recognitionRef.current?.stop(),
    interimText: ""          // kept for future UI if you want
  };
};
