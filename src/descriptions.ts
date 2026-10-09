// Descriptions sourced from the Witch Hat Atelier wiki:
// https://witchhatatelier.telepedia.net/wiki/Signs_Explained
// Keys are symbol names as used by the library (without category prefix).

import type { Lang } from "./i18n";

type Triple = { zh: string; en: string; ja: string };

const D: Record<string, Triple> = {
    // signs (officially named)
    "Column": {
        zh: "控制目标前进的方向，形成柱状的作用范围。加长符号可增加该方向上的压力或威力。",
        en: "Controls the direction a target proceeds in, creating a column-shaped area of effect. Lengthening the sign adds pressure or power in that direction.",
        ja: "対象の進む方向を制御し、柱状の効果範囲を作る。符号を長くするとその方向の圧力・威力が増す。"
    },
    "Dispersion": {
        zh: "使印章的魔力向外“散布”溢出，相当于向四周泄漏魔力的柱体。",
        en: "Causes the seal's magic to pour outwards, acting like a column that leaks its magic in all directions.",
        ja: "印章の魔力を外へ「分散」させて漏出させる。全方向に魔力が漏れる柱のようなもの。"
    },
    "Levitation": {
        zh: "使目标物体漂浮到空中，平衡时常呈球形。调整符号长度可决定漂浮高度、载重与速度。",
        en: "Floats a target into the air, often shaping it into a sphere when balanced. Length determines height, weight capacity and speed.",
        ja: "対象を空中に浮かせる。均衡すると球形になることが多い。長さで高さ・耐荷重・速度が決まる。"
    },
    "Convergence": {
        zh: "使法术的魔力向单点“汇聚”收束，也能让松散颗粒压实、变得紧固。",
        en: "Causes the spell's magic to converge to a single point; can also pack loose particles tightly together.",
        ja: "魔法の魔力を一点に「収束」させる。緩い粒子を固く押し固めることもできる。"
    },
    "Puppet": {
        zh: "允许有意识地操纵目标物体的运动。与风印记搭配可让目标飞行并在空中被操纵。",
        en: "Allows conscious manipulation of a target's movement. Paired with the Wind Sigil, the target can fly and be steered mid-air.",
        ja: "対象の動きを意のままに操る。風の印と組み合わせると対象を飛行・操作できる。"
    },
    "Crush": {
        zh: "将目标碾碎成更小的碎片，直至沙状或粉末。倒转使用时碎屑会复原成原形。",
        en: "Crushes a target into smaller pieces until sand-like or powdered. Inverted, the material reforms into its original shape.",
        ja: "対象を砂状や粉末になるまで砕く。逆さまにすると元の形に戻る。"
    },
    "Repetition": {
        zh: "重复法术的效果；自第 28 话起被重新归类为印记。",
        en: "Repeats a spell's effect; reclassified as a sigil from chapter 28 onwards.",
        ja: "魔法の効果を繰り返す。28話以降は印に分類し直された。"
    },
    "Pull": {
        zh: "使目标物体被拉向印章。箭头倾斜向内时，同时带有拉拽与扭转的效果。",
        en: "Pulls the target towards the seal. Angled inwards, the spell gains both a pulling and twisting effect.",
        ja: "対象を印章方向へ引き寄せる。斜め内向きにすると引寄せとねじれの両方の効果を持つ。"
    },
    "Stretch": {
        zh: "将受法术作用的固体变成细长而柔韧的缎带。",
        en: "Turns solid objects affected by the spell into long, flexible ribbons.",
        ja: "魔法に触れた固体を細長くしなやかなリボン状に変える。"
    },
    "Coil": {
        zh: "软化目标物体。只能作用于实体物质，对液体和气体无效。",
        en: "Softens a target object. Works only on physical matter; ineffective on liquids and gases.",
        ja: "対象を柔らかくする。物理的な物質にのみ有効で、液体や気体には効かない。"
    },
    "Conceal": {
        zh: "隐藏目标物体，例如将穿戴者隐于阴影之中。",
        en: "Hides a target object, such as concealing the wearer in shadow.",
        ja: "対象を隠す。例えば着用者を影に紛れ込ませる。"
    },
    "Reflect": {
        zh: "作用于目标物体上呈现的镜像进行法术瞄准。",
        en: "Targets a reflected image found on the object the seal is drawn on.",
        ja: "印章が描かれた対象に映る像を狙いとして作用する。"
    },
    "Window": {
        zh: "连接两个在物理上并不相连的空间，创造出一个传送门。",
        en: "Connects two spaces that are not physically joined, essentially creating a portal.",
        ja: "物理的に繋がっていない二つの空間を繋ぎ、扉のようにする。"
    },
    "Windowway": {
        zh: "连接两个不相连的空间，形成可供通行的“窗口”。",
        en: "Joins two unconnected spaces, forming a passable \"windowway\" between them.",
        ja: "繋がっていない空間同士を結び、通行可能な「窓」を作る。"
    },
    "Cool": {
        zh: "使物体降温。",
        en: "Cools things down.",
        ja: "物を冷やす。"
    },
    "Gather": {
        zh: "让法术利用周围环境的材料来构建效果，主动将材料吸入。",
        en: "Lets a spell build its effect from surrounding material, actively drawing it in.",
        ja: "周囲の材料を取り込んで魔法の効果を構築する。"
    },
    "Stability": {
        zh: "使目标在空中保持水平平衡，可以旋转移动但始终保持水平。",
        en: "Balances a target on a level plane in air; it may rotate and move but always stays level.",
        ja: "対象を空中の水平面に保つ。回転や移動はできるが常に水平を保つ。"
    },
    "Sign of Wind": {
        zh: "与风相关的符文，具体功能尚不明确。",
        en: "A sign related to wind; its exact function remains unclear.",
        ja: "風に関係する紋。正確な機能は不明。"
    },
    "Aeriforms Defined": {
        zh: "与风和气态相关的修饰符文；可用作“脚下生风”印记的修饰。",
        en: "A wind/aeriform modifier sign; can modify the Wind Underfoot sigil.",
        ja: "風や気体に関わる修飾の紋。「風に乗る」印の修飾にも使える。"
    },
    "Region": {
        zh: "决定魔法显现的位置：指向一侧则向该方向射出，向内只在环内显现，向外只在环外显现。",
        en: "Determines where magic manifests relative to the seal: sideways shoots that way, inwards manifests only inside the ring, outwards only outside.",
        ja: "魔法がどこに現れるかを決める。横に向けばその方向へ、内向きなら環内、外向きなら環外に現れる。"
    },
    "Empower": {
        zh: "使物体更坚固、更硬、更耐用。",
        en: "Presumably makes objects stronger, harder and more durable.",
        ja: "物体をより強固で硬く、耐久性のあるものにする。"
    },
    "Focus": {
        zh: "让法术可通过意念控制，用于将法术瞄准某一点或目标。",
        en: "Allows a spell to be controlled via the mind, aiming it at a point or target.",
        ja: "魔法を念力で制御し、狙いを定めることができる。"
    },
    "Entwine": {
        zh: "使绘制它的物体（如缎带）缠绕、卷绕在其他物体上。",
        en: "Makes the object it is drawn on (such as a ribbon) wrap itself around other objects.",
        ja: "描かれた物体（リボンなど）を他の物体に巻き付かせる。"
    },
    "Detection": {
        zh: "功能尚不明确，但可辅助“光石之路”等法术的运作。",
        en: "Function unclear, but it assists spells such as the Glowstone Path.",
        ja: "機能は不明だが、「 glowstone の道」などの魔法を補助する。"
    },
    "Partition": {
        zh: "勾勒作用范围的边界，效果向四周及上方延展；拉长符号可拉伸或塑造边界。",
        en: "Outlines the borders of an area of effect extending outwards and upwards; elongate it to shape the borders.",
        ja: "効果範囲の境界を描く。外と上に広がり、伸ばして境界を形づくれる。"
    },
    "Refuse": {
        zh: "收集不需要的物质（如废物）并将其引向符号所指之处。",
        en: "Collects unwanted material such as waste towards where it points.",
        ja: "不要な物（ゴミなど）を指す先へ集める。"
    },
    "Solidify": {
        zh: "使其内部或相连的魔法更加凝固、实体化。",
        en: "Likely causes magic drawn within or connected to it to become more solid.",
        ja: "内部や接続された魔法をより固体化させる。"
    },
    "Bind": {
        zh: "停止目标材料的运动并将其绑定成一体，使其作为整体行动。",
        en: "Halts the movement of target material and binds it together to act as a single unit.",
        ja: "対象の動きを止め、一つに束ねて全体として動かす。"
    },
    "Envelop": {
        zh: "使魔法效果包裹、笼罩其目标。",
        en: "Causes a magic effect to envelop or surround its target.",
        ja: "魔法の効果対象を包み込む。"
    },
    "Immobility": {
        zh: "使目标相对印章不可移动，形状如冻结，但仍可整体搬运。",
        en: "Makes the target immovable relative to the seal, frozen in shape yet still portable as a whole.",
        ja: "対象を印章に対して不動にする。形は凍結したままだが、全体としては運べる。"
    },
    "Holding": {
        zh: "将目标保持在印章所定义的形状中，同时仍允许其运动。",
        en: "Holds the target in the shape defined by the seal while still allowing movement.",
        ja: "印章の定めた形を保たせたまま、動きは許す。"
    },
    "Pointing": {
        zh: "使目标以圆锥形显现，并可通过柱符等符文进行导向。",
        en: "Manifests the target as a cone that can be directed by signs such as Columns.",
        ja: "対象を円錐形に現出させ、柱の紋などで方向づけられる。"
    },
    "Glaives": {
        zh: "决定魔法嵌入肉体的深度。独特之处在于可以画在环外，只要与环相连。",
        en: "Determines how deeply magic embeds into flesh. Uniquely, glaives may be drawn outside the ring as long as they connect to it.",
        ja: "魔法が肉に刻み込まれる深さを決める。環に繋がっていれば環の外に描ける特殊な紋。"
    },
    "Mimicry": {
        zh: "引导或模仿目标物体的运动。与装饰性印记并用时可模仿该印记所绘之物的动作。",
        en: "Guides or imitates a target's movements. With a decorative sigil, it imitates what the sigil depicts.",
        ja: "対象の動きを模倣・誘導する。装飾印と併用するとその印の描くものの動きを真似る。"
    },
    // decorative
    "Bird A": { zh: "装饰性符文：赋予法术大致的飞鸟形态。", en: "Decorative sign: gives the spell the rough shape of a bird.", ja: "装飾の紋：魔法に鳥の形を与える。" },
    "Bird B": { zh: "装饰性符文：赋予法术大致的飞鸟形态。", en: "Decorative sign: gives the spell the rough shape of a bird.", ja: "装飾の紋：魔法に鳥の形を与える。" },
    "Fish A": { zh: "装饰性符文：赋予法术大致的鱼形态。", en: "Decorative sign: gives the spell the rough shape of a fish.", ja: "装飾の紋：魔法に魚の形を与える。" },
    "Fish B": { zh: "装饰性符文：赋予法术大致的鱼形态。", en: "Decorative sign: gives the spell the rough shape of a fish.", ja: "装飾の紋：魔法に魚の形を与える。" },
    "Dragon": { zh: "装饰性符文：赋予法术大致的龙形态。", en: "Decorative sign: gives the spell the rough shape of a dragon.", ja: "装飾の紋：魔法に竜の形を与える。" },
    "Horse": { zh: "装饰性符文：赋予法术大致的马形态。", en: "Decorative sign: gives the spell the rough shape of a horse.", ja: "装飾の紋：魔法に馬の形を与える。" },
    "Frillram": { zh: "装饰性符文：赋予法术大致的生物形态。", en: "Decorative sign: gives the spell the rough shape of a creature.", ja: "装飾の紋：魔法に生物の形を与える。" },
    "Liongoat": { zh: "装饰性符文：赋予法术大致的狮鹫形态。", en: "Decorative sign: gives the spell the rough shape of a liongoat.", ja: "装飾の紋：魔法にライオンゴートの形を与える。" },
    "Owlcat": { zh: "装饰性符文：赋予法术大致的猫头鹰形态。", en: "Decorative sign: gives the spell the rough shape of an owlcat.", ja: "装飾の紋：魔法にフクロウ猫の形を与える。" },
    "Owlcat Head": { zh: "装饰性符文：赋予法术大致的猫头鹰头部形态。", en: "Decorative sign: gives the spell the rough shape of an owlcat head.", ja: "装飾の紋：魔法にフクロウ猫の頭の形を与える。" },
    "Torchstag": { zh: "装饰性符文：赋予法术大致的燃灯鹿形态。", en: "Decorative sign: gives the spell the rough shape of a torchstag.", ja: "装飾の紋：魔法にトーチスタグの形を与える。" },
    "Valance Leech": { zh: "装饰性符文：赋予法术大致的水蛭形态。", en: "Decorative sign: gives the spell the rough shape of a valance leech.", ja: "装飾の紋：魔法にバランスヒルの形を与える。" },
    "Scalewolf": { zh: "装饰性符文：赋予法术大致的鳞狼形态。", en: "Decorative sign: gives the spell the rough shape of a scalewolf.", ja: "装飾の紋：魔法にスケールウルフの形を与える。" },
    // unofficial signs
    "Collection": { zh: "收集印章上方与周围的材料，供法术使用。", en: "Collects material above and around the seal for the spell to use.", ja: "印章の周囲と上部の材料を集めて魔法に使わせる。" },
    "Billow": { zh: "将可用材料化作蓬松的云朵，非常适合乘坐。", en: "Turns available material into a fluffy, comfortable cloud to sit on.", ja: "材料をふわふわの雲に変え、座るのにちょうどよい。" },
    "Diamond": { zh: "功能未知；可能使法术只影响容器内的物体而不影响容器本身。", en: "Unknown; likely makes the spell affect only objects inside its container, not the container.", ja: "機能不明。容器そのものではなく中身だけに効くと思われる。" },
    "Eye": { zh: "功能未知的选择类符文；可能使法术只作用于绘制它的物体。", en: "Unknown selection sign; likely makes the spell affect only the object it is drawn on.", ja: "機能不明の選択の紋。描いた物体だけに効くと思われる。" },
    "Enlarge": { zh: "操纵目标大小：角向外指时变大，向内指时缩小。", en: "Manipulates a target's size: grows when corners point outwards, shrinks when inwards.", ja: "対象の大きさを操作する。角が外向きで拡大、内向きで縮小。" },
    "Enlarge (Inverted)": { zh: "倒转的扩缩符文：角向外指时变大，向内指时缩小。", en: "Inverted expansion sign: grows when corners point outwards, shrinks when inwards.", ja: "逆さまの拡縮の紋。角が外向きで拡大、内向きで縮小。" },
    "Crosshair": { zh: "使印章的魔法效果瞄准十字短端所指向的目标。", en: "Aims the seal's effects at whatever the shorter ends of the crosshair point at.", ja: "十字の短い端が指すものへ魔法の効果を狙い合わせる。" },
    "Rain": { zh: "召唤目标物体，形态上会有视觉差异。倒转时形成目标无法存在的区域。", en: "Summons a target object, with visual differences in form. Inverted, creates an area the target cannot exist in.", ja: "対象を召喚する（姿は視覚的に異なる）。逆さにすると対象が存在できない領域を作る。" },
    "Rain (Inverted)": { zh: "倒转的雨符：形成目标物体无法存在或被推开的区域。", en: "Inverted rain sign: creates an area where the target cannot exist or is pushed away.", ja: "逆さの雨の紋：対象が存在できない、または押し出される領域を作る。" },
    "Orb": { zh: "在印章上方创造球形空间，受控材料自下而上在其中聚集。", en: "Creates a spherical space above the seal where controlled material collects from bottom to top.", ja: "印章の上に球形の空間を作り、材料が下から上へ集まる。" },
    "Purify": { zh: "将废物从水中分离，与“净化印记”功能相似。", en: "Separates waste from water, much like its counterpart the Sigil of Purification.", ja: "水からゴミを分離する。浄化の印と似た働き。" },
    "Link": { zh: "识别并建立两个断开、分离或同源目标之间的链接。", en: "Identifies and links two targets that were broken off, removed, or share a source.", ja: "離れた、または同源の二つの対象を結びつける。" },
    "Stillness": { zh: "将魔法固定在原地，使效果静止于单一位置。", en: "Holds magic in place, keeping the effect static in a single location.", ja: "魔法をその場に固定し、効果を一点に静止させる。" },
    "Project": { zh: "将给定效果向外投射，例如投射出镜中映出的野兽影像。", en: "Projects a given effect outwards, such as a beast's image reflected in a surface.", ja: "効果の外への投射に使う。鏡に映った獣の像などを投影する。" },
    "Launch": { zh: "使目标沿所指方向以强力但短促的“爆发”生成。", en: "Generates the target in the pointed direction as a powerful but short-lived burst.", ja: "指す方向へ強力だが短い「爆発」として対象を生み出す。" },
    "Bolt": { zh: "与闪电相关的符文。", en: "A sign related to lightning.", ja: "雷に関係する紋。" },
    "Radial": { zh: "使符文沿圆周径向排列分布。", en: "Arranges signs radially around a circle.", ja: "紋を円周に沿って放射状に並べる。" },
    "Vision": { zh: "与视觉相关的符文。", en: "A sign related to sight.", ja: "視覚に関係する紋。" },
    "Float": { zh: "使目标物体浮起。", en: "Makes a target object float.", ja: "対象を浮かせる。" },
    // sigils
    "Aeriforms": { zh: "气态印记：使物体化为气态，是“脚下生风”等风系法术的基础。", en: "Aeriform sigil: turns objects gaseous; the basis of wind spells like Wind Underfoot.", ja: "気体の印：物体を気体化する。「風に乗る」など風の魔法の基礎。" },
    "Bridging": { zh: "桥接印记：在两点之间构筑桥梁或连接。", en: "Bridging sigil: builds bridges or connections between two points.", ja: "架橋の印：二点間に橋や接続を作る。" },
    "Calling": { zh: "呼唤印记：召唤或招来目标。", en: "Calling sigil: summons or calls a target.", ja: "呼び出しの印：対象を召喚・招来する。" },
    "Crystalize": { zh: "结晶印记：使物质结晶化。", en: "Crystalize sigil: crystallizes matter.", ja: "結晶の印：物質を結晶化させる。" },
    "Earth": { zh: "土之印记：操纵大地与土壤。", en: "Earth sigil: manipulates the ground and soil.", ja: "土の印：大地や土を操る。" },
    "Fire": { zh: "火之印记：产生与操纵火焰。", en: "Fire sigil: creates and controls flames.", ja: "火の印：炎を生み出し操る。" },
    "Flickering Light": { zh: "微光印记：产生摇曳的光。", en: "Flickering Light sigil: produces flickering light.", ja: "瞬く光の印：揺らめく光を生む。" },
    "Flower": { zh: "花之印记：使法术呈现花的形态或生成花。", en: "Flower sigil: shapes the spell like a flower or produces flowers.", ja: "花の印：魔法を花の形にする、または花を生み出す。" },
    "Flower (Clean)": { zh: "花之印记（清晰版）：使法术呈现花的形态或生成花。", en: "Flower sigil (clean): shapes the spell like a flower or produces flowers.", ja: "花の印（クリア版）：魔法を花の形にする。" },
    "Guidance": { zh: "引导印记：为法术指示方向或引导目标。", en: "Guidance sigil: directs the spell or guides its target.", ja: "導きの印：魔法や対象の方向を導く。" },
    "Light": { zh: "光之印记：产生光。", en: "Light sigil: produces light.", ja: "光の印：光を生み出す。" },
    "Lightning": { zh: "雷之印记：产生闪电。", en: "Lightning sigil: produces lightning.", ja: "雷の印：稲妻を生み出す。" },
    "Ondulation": { zh: "波动印记：使物体产生波浪般的起伏。", en: "Ondulation sigil: gives objects wave-like undulation.", ja: "波動の印：物に波のようなうねりを与える。" },
    "Purification": { zh: "净化印记：净化、分离杂质。", en: "Purification sigil: purifies and separates impurities.", ja: "浄化の印：不純物を浄化・分離する。" },
    "Sand": { zh: "沙之印记：操纵沙土。", en: "Sand sigil: manipulates sand.", ja: "砂の印：砂を操る。" },
    "Smoke": { zh: "烟之印记：产生烟雾。", en: "Smoke sigil: produces smoke.", ja: "煙の印：煙を生み出す。" },
    "Stop": { zh: "停止印记：使目标停止运动。", en: "Stop sigil: halts the target's movement.", ja: "停止の印：対象の動きを止める。" },
    "Sword": { zh: "剑之印记：生成剑状物。", en: "Sword sigil: creates sword-like shapes.", ja: "剣の印：剣のような形を生み出す。" },
    "Unburning Flames": { zh: "不燃之焰：产生不产生热量的火焰。", en: "Unburning Flames sigil: produces flames without heat.", ja: "燃えない炎の印：熱のない炎を生む。" },
    "Water": { zh: "水之印记：产生与操纵水。", en: "Water sigil: creates and controls water.", ja: "水の印：水を生み出し操る。" },
    "Whorling Winds": { zh: "旋风印记：产生旋涡状的风。", en: "Whorling Winds sigil: produces swirling winds.", ja: "渦風の印：渦巻く風を生み出す。" },
    "Wind": { zh: "风之印记：产生风。", en: "Wind sigil: produces wind.", ja: "風の印：風を生み出す。" },
    "Wind (Clean)": { zh: "风之印记（清晰版）：产生风。", en: "Wind sigil (clean): produces wind.", ja: "風の印（クリア版）：風を生み出す。" },
    "Wind Underfoot": { zh: "脚下生风：在脚下产生风的经典法术印记。", en: "Wind Underfoot sigil: the classic spell that generates wind beneath the feet.", ja: "風に乗る：足元に風を生み出す有名な魔法の印。" },
    // forbiddens
    "Counterclock": { zh: "禁忌魔法：逆转时间或物体状态。", en: "Forbidden magic: reverses time or an object's state.", ja: "禁呪：時間や物体の状態を逆転させる。" },
    "Memory Erasure (Anime)": { zh: "禁忌魔法：抹除记忆。", en: "Forbidden magic: erases memories.", ja: "禁呪：記憶を消し去る。" },
    "Scalewolf Curse": { zh: "禁忌魔法：鳞狼的诅咒。", en: "Forbidden magic: the Scalewolf curse.", ja: "禁呪：スケールウルフの呪い。" },
    "Time Stop": { zh: "禁忌魔法：停止时间。", en: "Forbidden magic: stops time.", ja: "禁呪：時間を止める。" },
    // shapes
    "Circle": { zh: "基础几何形状：圆形。", en: "Basic geometric shape: circle.", ja: "基本図形：円。" },
    "Cross": { zh: "基础几何形状：十字。", en: "Basic geometric shape: cross.", ja: "基本図形：十字。" },
    "Hexagon": { zh: "基础几何形状：六边形。", en: "Basic geometric shape: hexagon.", ja: "基本図形：六角形。" },
    "Line": { zh: "基础几何形状：直线。", en: "Basic geometric shape: line.", ja: "基本図形：直線。" },
    "Octagon": { zh: "基础几何形状：八边形。", en: "Basic geometric shape: octagon.", ja: "基本図形：八角形。" },
    "Pentagon": { zh: "基础几何形状：五边形。", en: "Basic geometric shape: pentagon.", ja: "基本図形：五角形。" },
    "Square": { zh: "基础几何形状：正方形。", en: "Basic geometric shape: square.", ja: "基本図形：正方形。" },
    "Star": { zh: "基础几何形状：星形。", en: "Basic geometric shape: star.", ja: "基本図形：星形。" },
    "Triangle": { zh: "基础几何形状：三角形。", en: "Basic geometric shape: triangle.", ja: "基本図形：三角形。" },
    // the owl house glyphs
    "Fire Glyph": { zh: "猫头鹰之屋：火之符文。", en: "The Owl House: fire glyph.", ja: "フクロウの家：火のグリフ。" },
    "Ice Glyph": { zh: "猫头鹰之屋：冰之符文。", en: "The Owl House: ice glyph.", ja: "フクロウの家：氷のグリフ。" },
    "King Glyph": { zh: "猫头鹰之屋：王之符文。", en: "The Owl House: king glyph.", ja: "フクロウの家：王のグリフ。" },
    "Light Glyph": { zh: "猫头鹰之屋：光之符文。", en: "The Owl House: light glyph.", ja: "フクロウの家：光のグリフ。" },
    "Plant Glyph": { zh: "猫头鹰之屋：植物之符文。", en: "The Owl House: plant glyph.", ja: "フクロウの家：植物のグリフ。" }
};

export function symbolDescription(name: string, lang: Lang): string | null {
    const entry = D[name];
    if (!entry) return null;
    return entry[lang === "zh-CN" ? "zh" : lang] ?? entry.en;
}
