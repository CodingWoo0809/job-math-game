import { parseMoney } from "./math-logic.mjs";
import { getConversionTask } from "./map3-data.mjs";

export function convertUnits(taskId) {
  const task = getConversionTask(taskId);
  return task?.answer ?? null;
}

export function evaluateConversionAnswer(taskId, inputValue) {
  const task = getConversionTask(taskId);
  const input = parseMoney(inputValue);
  if (!task) return { ok: false, code: "unknown-task", message: "장치 정보를 다시 확인해 줘." };
  if (input === null) return { ok: false, code: "missing", message: "숫자로 답을 입력해 줘." };
  if (input === task.answer) {
    return { ok: true, code: "correct", message: `${task.device} 활성화 완료!` };
  }

  const targeted = {
    coolant: {
      275: "L와 mL의 숫자를 이어 붙이면 안 돼. 2 L를 2,000 mL로 바꾼 뒤 75 mL를 더해 보자.",
      2000: "2 L는 정확히 바꿨어. 남아 있는 75 mL도 더해 보자."
    },
    schedule: {
      135: "시간과 분을 이어 붙이면 안 돼. 1시간을 60분으로 바꾼 뒤 35분을 더해 보자.",
      60: "1시간은 정확히 바꿨어. 남아 있는 35분도 더해 보자."
    },
    timer: {
      320: "분과 초의 숫자를 이어 붙이면 안 돼. 3분을 180초로 바꾼 뒤 20초를 더해 보자.",
      180: "3분은 정확히 바꿨어. 남아 있는 20초도 더해 보자."
    },
    equipment: {
      425: "kg과 g의 숫자를 이어 붙이면 안 돼. 4 kg을 4,000 g으로 바꾼 뒤 25 g을 더해 보자.",
      4000: "4 kg은 정확히 바꿨어. 남아 있는 25 g도 더해 보자."
    },
    route: {
      1250: "이 값은 m 단위에 가까워. 1 m = 100 cm를 이용해 한 번 더 변환해 보자.",
      12500: "km에서 cm까지의 변환 단계를 다시 확인해 봐. 1 km는 100,000 cm야."
    }
  };

  const message = targeted[taskId]?.[input];
  if (message) return { ok: false, code: "targeted", message };

  return {
    ok: false,
    code: "incorrect",
    message: `${task.relation}의 관계를 이용해 ${task.targetUnit} 단위의 전체 값을 다시 구해 보자.`
  };
}

