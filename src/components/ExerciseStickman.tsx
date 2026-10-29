import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, FastForward, Activity } from 'lucide-react';
import { MuscleGroup } from '../types';

export type AnimationArchetype =
  | 'bench_press_incline'
  | 'bench_press_flat'
  | 'chest_press_machine'
  | 'lat_pulldown'
  | 'cable_seated_row'
  | 'machine_row'
  | 'lateral_raise'
  | 'bicep_curl'
  | 'tricep_pushdown'
  | 'tricep_rope'
  | 'hammer_curl'
  | 'squat'
  | 'leg_press_45'
  | 'leg_press_horizontal'
  | 'romanian_deadlift'
  | 'leg_extension'
  | 'lying_leg_curl'
  | 'seated_leg_curl'
  | 'standing_calf_raise'
  | 'seated_calf_raise'
  | 'cable_crunch';

interface ExerciseStickmanProps {
  exerciseId?: string;
  exerciseName?: string;
  muscleGroup?: MuscleGroup;
  title?: string;
}

// Interpolação linear simples
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Curva suave de aceleração e desaceleração (Sinusoidal Easing)
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;

export function resolveAnimationArchetype(
  exerciseId?: string,
  name?: string,
  muscleGroup?: MuscleGroup
): AnimationArchetype {
  const cleanId = (exerciseId || '').toUpperCase().trim();
  const n = (name || '').toLowerCase();

  // 1. Mapeamento exato dos IDs oficiais da planilha
  const idMap: Record<string, AnimationArchetype> = {
    'A1': 'bench_press_incline',
    'A2': 'lat_pulldown',
    'A3': 'bench_press_flat',
    'A4': 'cable_seated_row',
    'A5': 'lateral_raise',
    'A6': 'bicep_curl',
    'A7': 'tricep_pushdown',
    'B1': 'squat',
    'B2': 'leg_press_45',
    'B3': 'romanian_deadlift',
    'B4': 'leg_extension',
    'B5': 'lying_leg_curl',
    'B6': 'standing_calf_raise',
    'B7': 'cable_crunch',
    'C1': 'leg_press_horizontal',
    'C2': 'seated_leg_curl',
    'C3': 'chest_press_machine',
    'C4': 'machine_row',
    'C5': 'lateral_raise',
    'C6': 'hammer_curl',
    'C7': 'tricep_rope',
    'C8': 'seated_calf_raise',
  };

  if (cleanId && idMap[cleanId]) {
    return idMap[cleanId];
  }

  // 2. Reconhecimento inteligente por palavras-chave no nome
  if (n.includes('inclinad') && (n.includes('supino') || n.includes('press') || n.includes('halter'))) {
    return 'bench_press_incline';
  }
  if (n.includes('supino') && (n.includes('maquina') || n.includes('máquina'))) {
    return 'chest_press_machine';
  }
  if (n.includes('supino') || n.includes('peck deck') || n.includes('voador') || n.includes('crucifixo') || n.includes('flexão') || n.includes('flexao')) {
    return 'bench_press_flat';
  }
  if (n.includes('puxada') || n.includes('pulldown') || n.includes('barra fixa') || n.includes('graviton')) {
    return 'lat_pulldown';
  }
  if (n.includes('remada') && (n.includes('sentad') || n.includes('cabo') || n.includes('baixa') || n.includes('polia'))) {
    return 'cable_seated_row';
  }
  if (n.includes('remada') && (n.includes('articulad') || n.includes('maquina') || n.includes('máquina') || n.includes('apoiad'))) {
    return 'machine_row';
  }
  if (n.includes('elevação lateral') || n.includes('elevacao lateral') || n.includes('desenvolvimento') || n.includes('ombro')) {
    return 'lateral_raise';
  }
  if (n.includes('martelo')) {
    return 'hammer_curl';
  }
  if (n.includes('rosca') || n.includes('biceps') || n.includes('bíceps')) {
    return 'bicep_curl';
  }
  if (n.includes('triceps') || n.includes('tríceps')) {
    if (n.includes('corda')) return 'tricep_rope';
    return 'tricep_pushdown';
  }
  if (n.includes('leg press') && (n.includes('45') || n.includes('inclinado'))) {
    return 'leg_press_45';
  }
  if (n.includes('leg press')) {
    return 'leg_press_horizontal';
  }
  if (n.includes('agachamento') || n.includes('squat') || n.includes('hack') || n.includes('afundo') || n.includes('bulgaro') || n.includes('búlgaro')) {
    return 'squat';
  }
  if (n.includes('rdl') || n.includes('stiff') || n.includes('levantamento terra') || n.includes('terra')) {
    return 'romanian_deadlift';
  }
  if (n.includes('extensora') || n.includes('extensao')) {
    return 'leg_extension';
  }
  if (n.includes('mesa flexora') || (n.includes('flexora') && n.includes('deitad'))) {
    return 'lying_leg_curl';
  }
  if (n.includes('flexora')) {
    return 'seated_leg_curl';
  }
  if (n.includes('panturrilha') && (n.includes('sentad') || n.includes('soleo') || n.includes('sóleo'))) {
    return 'seated_calf_raise';
  }
  if (n.includes('panturrilha') || n.includes('gemeos') || n.includes('gêmeos')) {
    return 'standing_calf_raise';
  }
  if (n.includes('abdom') || n.includes('crunch') || n.includes('core') || n.includes('infra')) {
    return 'cable_crunch';
  }

  // 3. Fallback inteligente por grupo muscular
  switch (muscleGroup) {
    case 'chest': return 'bench_press_flat';
    case 'back': return 'lat_pulldown';
    case 'shoulders': return 'lateral_raise';
    case 'arms': return 'bicep_curl';
    case 'quads': return 'squat';
    case 'hamstrings': return 'romanian_deadlift';
    case 'calves': return 'standing_calf_raise';
    case 'abs': return 'cable_crunch';
    default: return 'bench_press_flat';
  }
}

export const ExerciseStickman: React.FC<ExerciseStickmanProps> = ({
  exerciseId,
  exerciseName,
  muscleGroup,
  title,
}) => {
  const archetype = useMemo(
    () => resolveAnimationArchetype(exerciseId, exerciseName || title, muscleGroup),
    [exerciseId, exerciseName, title, muscleGroup]
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 0.6>(1);
  const [progress, setProgress] = useState(0); // 0 a 1
  const [isConcentric, setIsConcentric] = useState(true);

  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Ciclo da repetição: 2.8s total (tempo realista de musculação: descida controlada + subida explosiva)
  const CYCLE_DURATION = 2800 / speed;

  useEffect(() => {
    let rawCycle = 0;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        rawCycle = (rawCycle + delta) % CYCLE_DURATION;
        const norm = rawCycle / CYCLE_DURATION; // 0..1

        // Ping-pong com fase concêntrica e excêntrica
        let p = 0;
        if (norm < 0.45) {
          // Fase 1: Movimento de contração (0 -> 1)
          p = norm / 0.45;
          setIsConcentric(true);
        } else if (norm < 0.55) {
          // Pico de contração / pausa no topo
          p = 1;
          setIsConcentric(true);
        } else {
          // Fase 2: Retorno controlado (1 -> 0)
          p = 1 - (norm - 0.55) / 0.45;
          setIsConcentric(false);
        }

        setProgress(easeInOutSine(Math.max(0, Math.min(1, p))));
      }

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, CYCLE_DURATION]);

  const t = progress; // 0 (início/alongamento) a 1 (pico de contração)

  // Renderizador biomecânico do exercício selecionado
  const renderBiomechanics = () => {
    const floorY = 215;

    // Componentes auxiliares visuais reutilizáveis
    const jointDot = (cx: number, cy: number, key: string, isAccent = false) => (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={isAccent ? 4.5 : 3.5}
        className={isAccent ? 'fill-mint-400 drop-shadow-[0_0_6px_rgba(0,229,153,0.8)]' : 'fill-cyan-300'}
      />
    );

    const head = (cx: number, cy: number, lookAngle = 0) => (
      <g>
        <circle cx={cx} cy={cy} r={9} className="fill-slate-900 stroke-mint-400" strokeWidth="2.5" />
        {/* Viseira sutil para indicar para onde o boneco está olhando */}
        <line
          x1={cx + Math.cos(lookAngle) * 3}
          y1={cy + Math.sin(lookAngle) * 3}
          x2={cx + Math.cos(lookAngle) * 8}
          y2={cy + Math.sin(lookAngle) * 8}
          className="stroke-cyan-300"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    );

    switch (archetype) {
      // 1. SUPINO INCLINADO COM HALTERES (A1)
      case 'bench_press_incline': {
        const benchAngle = 35 * (Math.PI / 180);
        const hipX = 175, hipY = 160;
        const neckX = 105, neckY = 120;
        const headX = 92, headY = 110;
        const kneeX = 205, kneeY = 175;
        const footX = 220, footY = floorY;

        const shoulderX = 115, shoulderY = 126;
        // Halter move de junto ao peito até estendido acima
        const handX = lerp(128, 95, t);
        const handY = lerp(118, 62, t);
        const elbowX = lerp(138, 110, t);
        const elbowY = lerp(142, 92, t);

        return (
          <g>
            {/* Banco inclinado */}
            <line x1={80} y1={105} x2={180} y2={165} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={180} y1={165} x2={210} y2={175} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={150} y1={147} x2={150} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={195} y1={170} x2={195} y2={floorY} className="stroke-slate-800" strokeWidth="3" />

            {/* Perna & Tronco */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, -benchAngle)}

            {/* Braço & Halter */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {/* Halter */}
            <g transform={`translate(${handX}, ${handY}) rotate(-35)`}>
              <line x1={-12} y1={0} x2={12} y2={0} className="stroke-slate-400" strokeWidth="3" strokeLinecap="round" />
              <rect x={-14} y={-6} width={4} height={12} rx={1} className="fill-cyan-400" />
              <rect x={10} y={-6} width={4} height={12} rx={1} className="fill-cyan-400" />
            </g>

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(handX, handY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 2. PUXADA FRONTAL NA MÁQUINA (A2)
      case 'lat_pulldown': {
        const seatX = 145, seatY = 168;
        const hipX = 145, hipY = 162;
        const neckX = 135, neckY = 105;
        const headX = 132, headY = 88;
        const kneeX = 180, kneeY = 162;
        const footX = 180, footY = floorY;

        const shoulderX = 136, shoulderY = 114;
        // Puxa a barra de cima até a clavícula
        const handX = lerp(165, 150, t);
        const handY = lerp(45, 115, t);
        const elbowX = lerp(155, 122, t);
        const elbowY = lerp(80, 140, t);

        return (
          <g>
            {/* Máquina e Polia Superior */}
            <line x1={100} y1={seatY} x2={165} y2={seatY} className="stroke-slate-700" strokeWidth="5" strokeLinecap="round" />
            <line x1={115} y1={seatY} x2={115} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            {/* Torre e Rolo da coxa */}
            <line x1={200} y1={30} x2={200} y2={floorY} className="stroke-slate-800" strokeWidth="5" />
            <line x1={160} y1={30} x2={200} y2={30} className="stroke-slate-700" strokeWidth="4" />
            <circle cx={165} cy={30} r={6} className="fill-slate-900 stroke-cyan-400" strokeWidth="2" />
            <circle cx={175} cy={155} r={7} className="fill-slate-700 stroke-slate-500" strokeWidth="2" />

            {/* Cabo da polia */}
            <line x1={165} y1={30} x2={handX} y2={handY} className="stroke-cyan-400/80" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Barra da Puxada */}
            <line x1={handX - 22} y1={handY - 2} x2={handX + 22} y2={handY + 2} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />

            {/* Corpo */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, -0.2)}

            {/* Braço puxando com foco em dorsais */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(handX, handY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 3. SUPINO RETO COM BARRA (A3)
      case 'bench_press_flat': {
        const benchY = 152;
        const headX = 90, headY = 142;
        const neckX = 105, neckY = 148;
        const hipX = 175, hipY = 148;
        const kneeX = 205, kneeY = 162;
        const footX = 215, footY = floorY;

        const shoulderX = 118, shoulderY = 148;
        // Barra desce até encostar no peito e sobe estendendo
        const barX = 118;
        const barY = lerp(138, 88, t);
        const elbowX = lerp(100, 118, t);
        const elbowY = lerp(162, 118, t);

        return (
          <g>
            {/* Banco Reto e Suportes */}
            <line x1={70} y1={benchY} x2={190} y2={benchY} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={85} y1={benchY} x2={85} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={175} y1={benchY} x2={175} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={75} y1={75} x2={75} y2={floorY} className="stroke-slate-800" strokeWidth="3" />

            {/* Corpo deitado */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, -Math.PI / 2)}

            {/* Braço empurrando a barra */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={barX} y2={barY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {/* Barra e Anilhas */}
            <line x1={barX} y1={barY - 14} x2={barX} y2={barY + 14} className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
            <rect x={barX - 4} y={barY - 18} width={8} height={36} rx={2} className="fill-mint-500 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(barX, barY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 4. REMADA SENTADA NO CABO (A4)
      case 'cable_seated_row': {
        const seatY = 175;
        const hipX = 110, hipY = 172;
        const neckX = 115, neckY = 112;
        const headX = 115, headY = 94;
        const kneeX = 165, kneeY = 160;
        const footX = 205, footY = 172;

        const shoulderX = 118, shoulderY = 122;
        // Puxa o triângulo em direção ao umbigo com escápulas
        const handX = lerp(195, 138, t);
        const handY = lerp(148, 150, t);
        const elbowX = lerp(155, 96, t);
        const elbowY = lerp(135, 142, t);

        return (
          <g>
            {/* Banco e Apoio dos Pés */}
            <line x1={90} y1={seatY} x2={150} y2={seatY} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={100} y1={seatY} x2={100} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={140} y1={seatY} x2={140} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={205} y1={155} x2={205} y2={185} className="stroke-slate-600" strokeWidth="5" strokeLinecap="round" />
            {/* Polia Baixa */}
            <circle cx={235} cy={165} r={7} className="fill-slate-900 stroke-cyan-400" strokeWidth="2" />
            <line x1={235} y1={165} x2={handX} y2={handY} className="stroke-cyan-400" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Puxador Triângulo */}
            <polygon
              points={`${handX},${handY - 6} ${handX + 8},${handY} ${handX},${handY + 6}`}
              className="fill-slate-400"
            />

            {/* Corpo */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Braço puxando */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(handX, handY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 5. ELEVAÇÃO LATERAL COM HALTERES (A5, C5) - Visão Frontal
      case 'lateral_raise': {
        const neckX = 160, neckY = 96;
        const headX = 160, headY = 78;
        const pelvisX = 160, pelvisY = 145;

        // Pés firmes no chão
        const leftKneeX = 146, leftKneeY = 180, leftFootX = 142, leftFootY = floorY;
        const rightKneeX = 174, rightKneeY = 180, rightFootX = 178, rightFootY = floorY;

        const leftShoulderX = 144, leftShoulderY = 104;
        const rightShoulderX = 176, rightShoulderY = 104;

        // Braços elevam-se até a horizontal
        const leftElbowX = lerp(138, 114, t);
        const leftElbowY = lerp(140, 104, t);
        const leftHandX = lerp(134, 90, t);
        const leftHandY = lerp(155, 108, t);

        const rightElbowX = lerp(182, 206, t);
        const rightElbowY = lerp(140, 104, t);
        const rightHandX = lerp(186, 230, t);
        const rightHandY = lerp(155, 108, t);

        return (
          <g>
            {/* Pernas & Coluna (Visão Frontal) */}
            <line x1={pelvisX} y1={pelvisY} x2={leftKneeX} y2={leftKneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={leftKneeX} y1={leftKneeY} x2={leftFootX} y2={leftFootY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={pelvisX} y1={pelvisY} x2={rightKneeX} y2={rightKneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={rightKneeX} y1={rightKneeY} x2={rightFootX} y2={rightFootY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />

            <line x1={pelvisX} y1={pelvisY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="5" strokeLinecap="round" />
            {head(headX, headY, Math.PI / 2)}

            {/* Braço Esquerdo */}
            <line x1={leftShoulderX} y1={leftShoulderY} x2={leftElbowX} y2={leftElbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={leftElbowX} y1={leftElbowY} x2={leftHandX} y2={leftHandY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />
            {/* Halter Esquerdo */}
            <line x1={leftHandX - 8} y1={leftHandY} x2={leftHandX + 8} y2={leftHandY} className="stroke-slate-400" strokeWidth="3" strokeLinecap="round" />
            <circle cx={leftHandX - 8} cy={leftHandY} r={4} className="fill-cyan-400" />
            <circle cx={leftHandX + 8} cy={leftHandY} r={4} className="fill-cyan-400" />

            {/* Braço Direito */}
            <line x1={rightShoulderX} y1={rightShoulderY} x2={rightElbowX} y2={rightElbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={rightElbowX} y1={rightElbowY} x2={rightHandX} y2={rightHandY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />
            {/* Halter Direito */}
            <line x1={rightHandX - 8} y1={rightHandY} x2={rightHandX + 8} y2={rightHandY} className="stroke-slate-400" strokeWidth="3" strokeLinecap="round" />
            <circle cx={rightHandX - 8} cy={rightHandY} r={4} className="fill-cyan-400" />
            <circle cx={rightHandX + 8} cy={rightHandY} r={4} className="fill-cyan-400" />

            {jointDot(leftShoulderX, leftShoulderY, 'ls')}
            {jointDot(rightShoulderX, rightShoulderY, 'rs')}
            {jointDot(leftElbowX, leftElbowY, 'le', true)}
            {jointDot(rightElbowX, rightElbowY, 're', true)}
          </g>
        );
      }

      // 6. ROSCA DIRETA / BÍCEPS (A6, C6)
      case 'bicep_curl':
      case 'hammer_curl': {
        const hipX = 145, hipY = 140;
        const neckX = 145, neckY = 88;
        const headX = 145, headY = 72;
        const kneeX = 148, kneeY = 175;
        const footX = 150, footY = floorY;

        const shoulderX = 145, shoulderY = 98;
        const elbowX = 145, elbowY = 130; // Cotovelo estritamente travado na lateral!

        // Flexão pura do antebraço
        const handX = lerp(152, 168, t);
        const handY = lerp(165, 105, t);

        return (
          <g>
            {/* Pernas e Postura */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Braço & Antebraço */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {/* Barra / Halter */}
            <circle cx={handX} cy={handY} r={6} className="fill-mint-500 drop-shadow-[0_0_8px_rgba(0,229,153,0.6)]" />
            <line x1={handX - 10} y1={handY} x2={handX + 10} y2={handY} className="stroke-slate-300" strokeWidth="3" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e')}
            {jointDot(handX, handY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 7. TRÍCEPS PULLEY / CORDA (A7, C7)
      case 'tricep_pushdown':
      case 'tricep_rope': {
        const hipX = 135, hipY = 140;
        const neckX = 148, neckY = 92;
        const headX = 152, headY = 76;
        const kneeX = 142, kneeY = 175;
        const footX = 145, footY = floorY;

        const shoulderX = 146, shoulderY = 100;
        const elbowX = 150, elbowY = 126; // Cotovelo fixo

        // Extensão do tríceps até travar embaixo
        const handX = lerp(172, 160, t);
        const handY = lerp(126, 166, t);

        return (
          <g>
            {/* Polia Alta e Cabo */}
            <circle cx={185} cy={40} r={7} className="fill-slate-900 stroke-cyan-400" strokeWidth="2" />
            <line x1={185} y1={40} x2={handX} y2={handY} className="stroke-cyan-400" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Barra V / Corda */}
            <line x1={handX - 6} y1={handY - 4} x2={handX + 6} y2={handY + 4} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />

            {/* Pernas e Tronco (Leve inclinação atlética) */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0.1)}

            {/* Braço */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e')}
            {jointDot(handX, handY, 'h', true)}
            {jointDot(kneeX, kneeY, 'k')}
          </g>
        );
      }

      // 8. AGACHAMENTO COMPLETO COM BARRA (B1)
      case 'squat': {
        const footX = 155, footY = floorY;

        // Biomecânica perfeita: Barra viaja em linha vertical pura!
        const barX = 150;
        const barY = lerp(85, 138, t); // desce no agachamento

        const hipX = lerp(150, 118, t);
        const hipY = lerp(135, 162, t);

        const kneeX = lerp(152, 174, t);
        const kneeY = lerp(175, 170, t);

        const neckX = lerp(150, 142, t);
        const neckY = lerp(84, 134, t);
        const headX = lerp(150, 146, t);
        const headY = lerp(68, 118, t);

        const elbowX = lerp(142, 132, t);
        const elbowY = lerp(104, 150, t);

        return (
          <g>
            {/* Pernas (Coxa paralela no topo da contração) */}
            <line x1={footX} y1={footY} x2={kneeX} y2={kneeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={hipX} y2={hipY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            {/* Tronco neutro com ângulo de estabilização */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Braço segurando a barra nas costas */}
            <line x1={neckX} y1={neckY} x2={elbowX} y2={elbowY} className="stroke-slate-400" strokeWidth="3.5" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={barX} y2={barY} className="stroke-slate-400" strokeWidth="3" strokeLinecap="round" />

            {/* Barra e anilha pesada descendo em linha reta */}
            <line x1={barX} y1={barY - 14} x2={barX} y2={barY + 14} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <rect x={barX - 4} y={barY - 18} width={8} height={36} rx={2} className="fill-mint-500 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]" />

            {/* Trajetória da barra pontilhada para mostrar alinhamento */}
            <line x1={barX} y1={85} x2={barX} y2={138} className="stroke-cyan-500/30" strokeWidth="1" strokeDasharray="2 2" />

            {jointDot(hipX, hipY, 'hip', true)}
            {jointDot(kneeX, kneeY, 'knee', true)}
            {jointDot(neckX, neckY, 'neck')}
          </g>
        );
      }

      // 9. LEG PRESS 45° (B2)
      case 'leg_press_45': {
        const hipX = 118, hipY = 152;
        const neckX = 85, neckY = 120;
        const headX = 72, headY = 108;

        // Plataforma deslizando no trilho de 45 graus
        const footX = lerp(178, 222, t);
        const footY = lerp(120, 76, t);
        const kneeX = lerp(130, 172, t);
        const kneeY = lerp(122, 114, t);

        return (
          <g>
            {/* Trilho guia do Leg 45 */}
            <line x1={150} y1={150} x2={250} y2={50} className="stroke-slate-800" strokeWidth="6" strokeLinecap="round" />
            {/* Encosto do banco 45 */}
            <line x1={65} y1={100} x2={125} y2={160} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={125} y1={160} x2={145} y2={150} className="stroke-slate-700" strokeWidth="5" strokeLinecap="round" />

            {/* Plataforma do Leg Press */}
            <line x1={footX - 10} y1={footY - 10} x2={footX + 10} y2={footY + 10} className="stroke-cyan-400" strokeWidth="6" strokeLinecap="round" />

            {/* Tronco */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, -Math.PI / 4)}

            {/* Pernas empurrando */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(kneeX, kneeY, 'knee', true)}
            {jointDot(footX, footY, 'foot', true)}
          </g>
        );
      }

      // 10. LEVANTAMENTO TERRA ROMENO / RDL / STIFF (B3)
      case 'romanian_deadlift': {
        const footX = 155, footY = floorY;
        const kneeX = 148, kneeY = 175; // Joelhos macios com leve flexão fixa

        // Dobradiça de quadril (Hip Hinge) para trás!
        const hipX = lerp(150, 114, t);
        const hipY = lerp(138, 140, t);

        const neckX = lerp(150, 168, t);
        const neckY = lerp(85, 128, t);
        const headX = lerp(150, 172, t);
        const headY = lerp(70, 118, t);

        // Barra desce rente às canelas
        const barX = lerp(162, 166, t);
        const barY = lerp(145, 178, t);

        return (
          <g>
            {/* Pernas (Foco isquiotibiais alongando) */}
            <line x1={footX} y1={footY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={hipX} y2={hipY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            {/* Coluna totalmente reta e protegida */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="5" strokeLinecap="round" />
            {head(headX, headY, 0.4)}

            {/* Braços estendidos segurando a barra */}
            <line x1={neckX} y1={neckY} x2={barX} y2={barY} className="stroke-slate-400" strokeWidth="3.5" strokeLinecap="round" />

            {/* Barra e anilhas */}
            <line x1={barX} y1={barY - 14} x2={barX} y2={barY + 14} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <rect x={barX - 4} y={barY - 18} width={8} height={36} rx={2} className="fill-mint-500 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]" />

            {jointDot(hipX, hipY, 'hip', true)}
            {jointDot(kneeX, kneeY, 'knee')}
            {jointDot(neckX, neckY, 'neck')}
          </g>
        );
      }

      // 11. CADEIRA EXTENSORA (B4)
      case 'leg_extension': {
        const hipX = 135, hipY = 155;
        const neckX = 135, neckY = 95;
        const headX = 135, headY = 78;
        const kneeX = 180, kneeY = 155;

        // Perna chuta para frente estendendo os quadríceps
        const footX = lerp(180, 225, t);
        const footY = lerp(205, 155, t);

        return (
          <g>
            {/* Banco da Cadeira Extensora */}
            <line x1={120} y1={90} x2={120} y2={160} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={120} y1={160} x2={180} y2={160} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={135} y1={160} x2={135} y2={floorY} className="stroke-slate-800" strokeWidth="4" />

            {/* Tronco & Coxa */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4.5" strokeLinecap="round" />

            {/* Canela estendendo (Quadríceps ativado) */}
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />

            {/* Rolo de apoio da máquina nas canelas */}
            <circle cx={footX} cy={footY} r={7} className="fill-slate-700 stroke-cyan-400" strokeWidth="2.5" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(kneeX, kneeY, 'knee', true)}
            {jointDot(footX, footY, 'foot', true)}
          </g>
        );
      }

      // 12. MESA FLEXORA DEITADA (B5)
      case 'lying_leg_curl': {
        const headX = 75, headY = 145;
        const neckX = 95, neckY = 150;
        const hipX = 155, hipY = 150;
        const kneeX = 195, kneeY = 150;

        // Calcanhar curva em direção aos glúteos
        const footX = lerp(240, 195, t);
        const footY = lerp(150, 105, t);

        return (
          <g>
            {/* Banco Horizontal da Mesa */}
            <line x1={60} y1={155} x2={205} y2={155} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={90} y1={155} x2={90} y2={floorY} className="stroke-slate-800" strokeWidth="4" />
            <line x1={180} y1={155} x2={180} y2={floorY} className="stroke-slate-800" strokeWidth="4" />

            {/* Tronco de bruços */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, -Math.PI / 6)}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4.5" strokeLinecap="round" />

            {/* Perna flexionando */}
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />

            {/* Rolo atrás dos tornozelos */}
            <circle cx={footX} cy={footY} r={7} className="fill-slate-700 stroke-cyan-400" strokeWidth="2.5" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(kneeX, kneeY, 'knee', true)}
            {jointDot(footX, footY, 'foot', true)}
          </g>
        );
      }

      // 13. PANTURRILHA EM PÉ NA MÁQUINA (B6)
      case 'standing_calf_raise': {
        const blockY = 208;
        const toeX = 162, toeY = blockY;

        // Corpo inteiro sobe na ponta dos pés
        const liftY = lerp(0, -18, t);

        const footX = 145;
        const footY = blockY + lerp(8, -12, t); // calcanhar desce abaixo do degrau e sobe alto

        const kneeX = 152, kneeY = 175 + liftY;
        const hipX = 150, hipY = 135 + liftY;
        const neckX = 150, neckY = 82 + liftY;
        const headX = 150, headY = 66 + liftY;

        return (
          <g>
            {/* Bloco/Step das Panturrilhas */}
            <rect x={140} y={blockY} width={50} height={12} className="fill-slate-700 stroke-slate-600" />
            <line x1={toeX} y1={toeY} x2={toeX + 15} y2={toeY} className="stroke-cyan-400" strokeWidth="2" />

            {/* Almofadas da máquina nos ombros */}
            <rect x={135} y={neckY - 6} width={30} height={10} rx={3} className="fill-slate-700 stroke-slate-500" />

            {/* Corpo inteiro estendido */}
            <line x1={footX} y1={footY} x2={toeX} y2={toeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={footX} y1={footY} x2={kneeX} y2={kneeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={hipX} y2={hipY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {jointDot(toeX, toeY, 'toe')}
            {jointDot(footX, footY, 'heel', true)}
            {jointDot(kneeX, kneeY, 'knee')}
          </g>
        );
      }

      // 14. ABDOMINAL NA POLIA (B7)
      case 'cable_crunch': {
        const kneeX = 145, kneeY = floorY;
        const hipX = 125, hipY = 185; // Quadril fixo nos calcanhares!

        // Coluna flexiona enrolando o abdômen em direção ao chão
        const neckX = lerp(165, 142, t);
        const neckY = lerp(130, 172, t);
        const headX = lerp(178, 148, t);
        const headY = lerp(120, 185, t);

        const handX = neckX + 6;
        const handY = neckY - 6;

        return (
          <g>
            {/* Polia Alta e Cabo */}
            <circle cx={225} cy={40} r={7} className="fill-slate-900 stroke-cyan-400" strokeWidth="2" />
            <line x1={225} y1={40} x2={handX} y2={handY} className="stroke-cyan-400" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Pernas ajoelhadas no colchonete */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={hipX - 15} y1={floorY} x2={hipX} y2={hipY} className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />

            {/* Coluna curvando no crunch */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-mint-400" strokeWidth="5" strokeLinecap="round" />
            {head(headX, headY, Math.PI / 3)}

            {/* Braços segurando a corda colada na cabeça */}
            <line x1={neckX} y1={neckY} x2={handX} y2={handY} className="stroke-slate-300" strokeWidth="3.5" strokeLinecap="round" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(neckX, neckY, 'neck', true)}
            {jointDot(handX, handY, 'hand')}
          </g>
        );
      }

      // 15. LEG PRESS HORIZONTAL (C1)
      case 'leg_press_horizontal': {
        const seatY = 165;
        const hipX = 100, hipY = 160;
        const neckX = 98, neckY = 100;
        const headX = 98, headY = 82;

        const footX = 230;
        const footY = 160;

        // Pernas estendendo na horizontal
        const kneeX = lerp(132, 172, t);
        const kneeY = lerp(138, 160, t);

        return (
          <g>
            {/* Encosto vertical e assento */}
            <line x1={90} y1={95} x2={90} y2={seatY} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={90} y1={seatY} x2={140} y2={seatY} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            {/* Placa vertical de apoio dos pés */}
            <line x1={footX} y1={130} x2={footX} y2={190} className="stroke-cyan-400" strokeWidth="6" strokeLinecap="round" />

            {/* Tronco */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Pernas empurrando */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(kneeX, kneeY, 'knee', true)}
            {jointDot(footX, footY, 'foot', true)}
          </g>
        );
      }

      // 16. CADEIRA FLEXORA SENTADA (C2)
      case 'seated_leg_curl': {
        const hipX = 130, hipY = 152;
        const neckX = 130, neckY = 95;
        const headX = 130, headY = 78;
        const kneeX = 175, kneeY = 152;

        // Perna flexiona para baixo e para trás embaixo do banco
        const footX = lerp(220, 175, t);
        const footY = lerp(152, 202, t);

        return (
          <g>
            {/* Banco e Apoio da coxa */}
            <line x1={115} y1={90} x2={115} y2={158} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={115} y1={158} x2={175} y2={158} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <circle cx={160} cy={144} r={6} className="fill-slate-700 stroke-slate-500" strokeWidth="2" />

            {/* Tronco & Coxa */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4.5" strokeLinecap="round" />

            {/* Perna puxando para baixo (Posteriores ativados) */}
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx={footX} cy={footY} r={7} className="fill-slate-700 stroke-cyan-400" strokeWidth="2.5" />

            {jointDot(hipX, hipY, 'hip')}
            {jointDot(kneeX, kneeY, 'knee')}
            {jointDot(footX, footY, 'foot', true)}
          </g>
        );
      }

      // 17. SUPINO RETO NA MÁQUINA (C3)
      case 'chest_press_machine': {
        const hipX = 135, hipY = 168;
        const neckX = 135, neckY = 100;
        const headX = 135, headY = 84;
        const kneeX = 175, kneeY = 168;
        const footX = 175, footY = floorY;

        const shoulderX = 135, shoulderY = 114;
        // Empurra a manopla para frente horizontalmente
        const handX = lerp(155, 205, t);
        const handY = 116;
        const elbowX = lerp(108, 170, t);
        const elbowY = lerp(120, 116, t);

        return (
          <g>
            {/* Banco e Alavanca da máquina */}
            <line x1={120} y1={80} x2={120} y2={172} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={120} y1={172} x2={165} y2={172} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            {/* Haste articulada da máquina */}
            <line x1={180} y1={50} x2={handX} y2={handY} className="stroke-slate-600" strokeWidth="4" strokeLinecap="round" />
            <circle cx={180} cy={50} r={5} className="fill-slate-800 stroke-cyan-400" strokeWidth="2" />

            {/* Corpo */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Braço empurrando */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {/* Manopla da máquina */}
            <line x1={handX} y1={handY - 8} x2={handX} y2={handY + 8} className="stroke-cyan-400" strokeWidth="4" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(handX, handY, 'h', true)}
          </g>
        );
      }

      // 18. REMADA ARTICULADA NA MÁQUINA (C4)
      case 'machine_row': {
        const hipX = 135, hipY = 168;
        const neckX = 155, neckY = 110; // Tronco colado na almofada frontal
        const headX = 158, headY = 92;
        const kneeX = 175, kneeY = 175;
        const footX = 180, footY = floorY;

        const shoulderX = 152, shoulderY = 118;
        // Puxa as manoplas trazendo os cotovelos para trás
        const handX = lerp(215, 168, t);
        const handY = lerp(126, 134, t);
        const elbowX = lerp(185, 122, t);
        const elbowY = lerp(120, 128, t);

        return (
          <g>
            {/* Apoio do Peitoral e Assento */}
            <line x1={120} y1={172} x2={165} y2={172} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <line x1={165} y1={105} x2={165} y2={155} className="stroke-slate-700" strokeWidth="7" strokeLinecap="round" />
            {/* Alavanca articulada */}
            <line x1={220} y1={60} x2={handX} y2={handY} className="stroke-slate-600" strokeWidth="4" strokeLinecap="round" />
            <circle cx={220} cy={60} r={5} className="fill-slate-800 stroke-cyan-400" strokeWidth="2" />

            {/* Corpo */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={footX} y2={footY} className="stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}

            {/* Braço puxando com força de dorsal */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} className="stroke-mint-400" strokeWidth="4" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} className="stroke-mint-400" strokeWidth="3.5" strokeLinecap="round" />

            {jointDot(shoulderX, shoulderY, 's')}
            {jointDot(elbowX, elbowY, 'e', true)}
            {jointDot(handX, handY, 'h', true)}
          </g>
        );
      }

      // 19. PANTURRILHA SENTADA (C8)
      case 'seated_calf_raise': {
        const hipX = 120, hipY = 150;
        const neckX = 120, neckY = 95;
        const headX = 120, headY = 78;

        const toeX = 185, toeY = 208;
        // Calcanhar sobe empurrando o joelho para cima
        const heelY = lerp(218, 192, t);
        const kneeY = lerp(155, 142, t);
        const kneeX = 175;

        return (
          <g>
            {/* Banco & Step dos pés */}
            <line x1={100} y1={155} x2={145} y2={155} className="stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
            <rect x={170} y={208} width={30} height={10} className="fill-slate-700 stroke-slate-600" />

            {/* Almofada da máquina nos joelhos */}
            <rect x={kneeX - 10} y={kneeY - 10} width={20} height={10} rx={2} className="fill-slate-700 stroke-cyan-400" />

            {/* Corpo */}
            <line x1={hipX} y1={hipY} x2={neckX} y2={neckY} className="stroke-white" strokeWidth="4.5" strokeLinecap="round" />
            {head(headX, headY, 0)}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} className="stroke-slate-300" strokeWidth="4.5" strokeLinecap="round" />

            {/* Panturrilha trabalhando */}
            <line x1={kneeX} y1={kneeY} x2={toeX - 10} y2={heelY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={toeX - 10} y1={heelY} x2={toeX} y2={toeY} className="stroke-mint-400" strokeWidth="4.5" strokeLinecap="round" />

            {jointDot(kneeX, kneeY, 'knee')}
            {jointDot(toeX - 10, heelY, 'heel', true)}
          </g>
        );
      }

      default:
        return null;
    }
  };

  const muscleLabelMap: Record<AnimationArchetype, string> = {
    bench_press_incline: 'Peitoral Superior & Tríceps',
    bench_press_flat: 'Peitoral Médio & Tríceps',
    chest_press_machine: 'Peitoral & Tríceps',
    lat_pulldown: 'Latíssimo do Dorso & Bíceps',
    cable_seated_row: 'Dorsais, Romboides & Bíceps',
    machine_row: 'Costas & Romboides',
    lateral_raise: 'Deltoides Laterais',
    bicep_curl: 'Bíceps Braquial',
    tricep_pushdown: 'Tríceps Braquial',
    tricep_rope: 'Tríceps (Cabeça Lateral & Longa)',
    hammer_curl: 'Braquial & Braquiorradial',
    squat: 'Quadríceps & Glúteos',
    leg_press_45: 'Quadríceps & Glúteos',
    leg_press_horizontal: 'Quadríceps & Glúteos',
    romanian_deadlift: 'Isquiotibiais & Glúteos',
    leg_extension: 'Quadríceps Isolado',
    lying_leg_curl: 'Isquiotibiais (Posterior)',
    seated_leg_curl: 'Isquiotibiais (Posterior)',
    standing_calf_raise: 'Gastrocnêmio (Panturrilha)',
    seated_calf_raise: 'Sóleo (Panturrilha)',
    cable_crunch: 'Reto Abdominal / Core',
  };

  return (
    <div className="bg-slate-950/80 border border-dark-border rounded-2xl overflow-hidden shadow-inner flex flex-col items-center">
      {/* Top Bar com Status da Biomecânica */}
      <div className="w-full px-4 py-2 border-b border-dark-border/60 flex items-center justify-between text-xs bg-dark-surface/60">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Activity className="w-3.5 h-3.5 text-mint-400 animate-pulse" />
          <span className="text-[11px] text-slate-400">Foco:</span>
          <span className="text-mint-400 font-semibold">{muscleLabelMap[archetype]}</span>
        </div>

        {/* Indicador da fase atual */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors ${
            isConcentric
              ? 'bg-mint-500/20 text-mint-300 border border-mint-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          }`}
        >
          {isConcentric ? 'Contração (Concêntrica)' : 'Alongamento (Excêntrica)'}
        </span>
      </div>

      {/* SVG Canvas da Animação */}
      <div className="relative w-full aspect-[4/3] max-h-56 sm:max-h-64 flex items-center justify-center p-2 bg-gradient-to-b from-slate-950 via-slate-900/60 to-dark-surface">
        <svg
          viewBox="0 0 320 240"
          className="w-full h-full max-w-sm drop-shadow-md select-none"
        >
          <defs>
            {/* Grade técnica biomecânica suave no fundo */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="320" height="240" fill="url(#grid)" />

          {/* Linha do Chão */}
          <line x1={20} y1={215} x2={300} y2={215} className="stroke-slate-800" strokeWidth="2" strokeDasharray="6 4" />

          {/* Renderização do Exercício */}
          {renderBiomechanics()}
        </svg>
      </div>

      {/* Controles de Reprodução */}
      <div className="w-full px-4 py-2 bg-dark-card/60 border-t border-dark-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-dark-surface hover:bg-dark-card text-white hover:text-mint-400 border border-dark-border transition active:scale-95 flex items-center gap-1 font-semibold text-[11px]"
            title={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-mint-400" />
                <span>Reproduzir</span>
              </>
            )}
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 0.6 : 1)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
              speed === 0.6
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-dark-surface text-slate-400 border-dark-border hover:text-white'
            }`}
            title="Alternar velocidade"
          >
            <FastForward className="w-3 h-3" />
            <span>{speed === 0.6 ? '0.6x Câmera Lenta' : '1x Normal'}</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Biomecânica 2D
        </div>
      </div>
    </div>
  );
};
