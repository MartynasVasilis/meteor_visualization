import React, { useState, useEffect, useRef } from "react";

/*
 MathQuiz - simple list of hard-coded questions.
 Callbacks:
  - onCorrect()
  - onWrong()
*/

// Generate a more difficult random math question
function generateQuestion() {
  // Randomly pick a type: 0=add, 1=sub, 2=mul, 3=div, 4=multi-step
  const type = Math.floor(Math.random() * 5);
  let q, a;
  if (type === 0) {
    // Large addition
    const x = Math.floor(Math.random() * 900 + 100);
    const y = Math.floor(Math.random() * 900 + 100);
    q = `${x} + ${y}`;
    a = x + y;
  } else if (type === 1) {
    // Large subtraction
    const x = Math.floor(Math.random() * 900 + 200);
    const y = Math.floor(Math.random() * 199 + 1);
    q = `${x} - ${y}`;
    a = x - y;
  } else if (type === 2) {
    // Multiplication
    const x = Math.floor(Math.random() * 40 + 10);
    const y = Math.floor(Math.random() * 30 + 10);
    q = `${x} × ${y}`;
    a = x * y;
  } else if (type === 3) {
    // Division with integer result
    const y = Math.floor(Math.random() * 19 + 2);
    const aInt = Math.floor(Math.random() * 30 + 5);
    const x = y * aInt;
    q = `${x} / ${y}`;
    a = aInt;
  } else {
    // Multi-step: (a + b) × c
    const a1 = Math.floor(Math.random() * 40 + 10);
    const b1 = Math.floor(Math.random() * 40 + 10);
    const c1 = Math.floor(Math.random() * 10 + 2);
    q = `(${a1} + ${b1}) × ${c1}`;
    a = (a1 + b1) * c1;
  }
  return { q, a };
}

export default function MathQuiz({
  onCorrect = () => {},
  onWrong = () => {},
  onTimeout = () => {},
  timePerQuestion = 30,
  numQuestions = 7,
}) {
  const [cur, setCur] = useState(generateQuestion());
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [answered, setAnswered] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cur, timePerQuestion]);

  useEffect(() => {
    if (timeLeft <= 0) {
      clearInterval(timerRef.current);
      onTimeout();
      setCur(generateQuestion());
      setInput("");
      setTimeLeft(timePerQuestion);
    }
  }, [timeLeft, onTimeout, timePerQuestion]);

  function submit() {
    const parsed = Number(input);
    if (Number.isNaN(parsed)) {
      alert("Please enter a number");
      return;
    }
    if (parsed === cur.a) {
      onCorrect();
      setAnswered((a) => a + 1);
      if (answered + 1 < numQuestions) {
        setCur(generateQuestion());
        setInput("");
        setTimeLeft(timePerQuestion);
      }
      // else: parent will handle completion
    } else {
      onWrong();
      setInput("");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontFamily: "monospace",
      }}
    >
      <div style={{ color: "lime" }}>{cur.q} =</div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          width: 64,
          padding: 6,
          borderRadius: 4,
          border: "1px solid lime",
          background: "black",
          color: "lime",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button
        style={{
          background: "black",
          color: "lime",
          border: "1px solid lime",
          borderRadius: 4,
          padding: "6px 12px",
          cursor: "pointer",
        }}
        onClick={submit}
      >
        OK
      </button>
      <div style={{ color: timeLeft < 6 ? "red" : "yellow", minWidth: 32 }}>
        {timeLeft}s
      </div>
    </div>
  );
}
