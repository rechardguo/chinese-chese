import type { PuzzleCategory } from '@shared/types/puzzle'

export const puzzleCategories: PuzzleCategory[] = [
  {
    id: 'basic-kills',
    name: '基础杀法',
    nameEn: 'Basic Killing Techniques',
    description: '单车杀、单马杀、双炮杀等基础杀法训练',
    difficulty: 'beginner',
    puzzles: [
      {
        id: 'basic-001',
        name: '闷宫杀',
        description: '炮到底线，借对方士做炮架闷杀，底卒封路',
        initialFen: '3aka3/4p4/9/9/9/9/9/9/1C7/3K5 w - - 0 1',
        moves: [
          { iccs: 'b1b9', notation: '炮八进8', isCorrect: true, comment: '炮到底线，借d9黑士做炮架闷宫将杀' }
        ],
        playerColor: 'r',
        difficulty: 1,
        category: 'basic-kills',
        tags: ['炮杀', '闷宫']
      },
      {
        id: 'basic-002',
        name: '重炮杀',
        description: '双炮同线，一炮做炮架，另一炮将军将杀',
        initialFen: '3aka3/C8/2H6/9/9/9/9/4C4/9/3K5',
        moves: [
          { iccs: 'a8e8', notation: '炮九平五', isCorrect: true, comment: '炮平移中路做炮架，底炮借架将军，马护炮位绝杀' }
        ],
        playerColor: 'r',
        difficulty: 2,
        category: 'basic-kills',
        tags: ['炮杀', '重炮']
      },
      {
        id: 'basic-003',
        name: '卧槽马',
        description: '马跳卧槽位置将军，配合底线卒将杀',
        initialFen: '3aka3/4p4/9/1H7/9/9/9/9/9/3K5',
        moves: [
          { iccs: 'b6c8', notation: '马八进七', isCorrect: true, comment: '马跳卧槽位将军，黑将被双士和底卒围困绝杀' }
        ],
        playerColor: 'r',
        difficulty: 2,
        category: 'basic-kills',
        tags: ['马杀', '卧槽马']
      },
      {
        id: 'basic-004',
        name: '挂角马',
        description: '马跳挂角位置将军，利用底卒封锁将路',
        initialFen: '3aka3/4p4/9/7H1/9/9/9/9/9/3K5 w - - 0 1',
        moves: [
          { iccs: 'h6f7', notation: '马二进1', isCorrect: true, comment: '马跳挂角将军，双士和底卒封死所有出路' }
        ],
        playerColor: 'r',
        difficulty: 2,
        category: 'basic-kills',
        tags: ['马杀', '挂角马']
      },
      {
        id: 'basic-005',
        name: '侧翼闷宫',
        description: '炮从侧翼到底线，借士做炮架闷杀，底卒封路',
        initialFen: '3aka3/4p4/9/9/9/4P4/C7/4R4/9/3K5 w - - 0 1',
        moves: [
          { iccs: 'a3a9', notation: '炮九进6', isCorrect: true, comment: '炮从a线到底线，借d9士做炮架将杀，红兵也配合封锁' }
        ],
        playerColor: 'r',
        difficulty: 2,
        category: 'basic-kills',
        tags: ['炮杀', '闷宫']
      },
      {
        id: 'basic-006',
        name: '沉底闷宫',
        description: '炮从底线上调将军，双士底卒围困绝杀',
        initialFen: '3aka3/4p4/9/9/9/9/9/9/C8/3K5 w - - 0 1',
        moves: [
          { iccs: 'a1a9', notation: '炮九进8', isCorrect: true, comment: '炮沉底，借d9士做炮架将杀，三士无法逃脱' }
        ],
        playerColor: 'r',
        difficulty: 1,
        category: 'basic-kills',
        tags: ['炮杀', '闷宫']
      }
    ]
  },
  {
    id: 'chariot-kills',
    name: '车类杀法',
    nameEn: 'Chariot Killing Techniques',
    description: '铁门栓、海底捞月、大胆穿心等车类杀法',
    difficulty: 'intermediate',
    puzzles: []
  },
  {
    id: 'horse-kills',
    name: '马类杀法',
    nameEn: 'Horse Killing Techniques',
    description: '卧槽马、挂角马、钓鱼马等马类杀法',
    difficulty: 'intermediate',
    puzzles: []
  },
  {
    id: 'cannon-kills',
    name: '炮类杀法',
    nameEn: 'Cannon Killing Techniques',
    description: '重炮、闷宫、空头炮等炮类杀法',
    difficulty: 'intermediate',
    puzzles: []
  },
  {
    id: 'combination-kills',
    name: '组合杀法',
    nameEn: 'Combination Killing Techniques',
    description: '马后炮、双将、车马炮配合等组合杀法',
    difficulty: 'advanced',
    puzzles: []
  },
  {
    id: 'endgame-patterns',
    name: '残局定式',
    nameEn: 'Endgame Patterns',
    description: '经典残局定式训练',
    difficulty: 'advanced',
    puzzles: []
  }
]
