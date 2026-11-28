// High-Detail 16-bit/32-bit Pixel Art Asset Loader with Chroma-Key & Edge Despill
class SpriteBank {
  constructor() {
    this.images = {};
    this.readyCount = 0;
    this.totalCount = 0;

    this.loadRaw("bg_harbour", "assets/bg_harbour.jpg");
    this.loadRaw("bg_harbour_sky", "assets/bg_harbour_sky.jpg?v=34");
    this.loadRaw("bg_harbour_seg1", "assets/bg_harbour_seg1.png?v=34");
    this.loadRaw("bg_harbour_seg2", "assets/bg_harbour_seg2.png?v=34");
    this.loadRaw("bg_harbour_seg3", "assets/bg_harbour_seg3.png?v=34");
    this.loadRaw("bg_restroom", "assets/bg_restroom.jpg");
    this.loadRaw("bg_airport_tarmac", "assets/bg_airport_tarmac.jpg");
    this.loadRaw("bg_dadaocheng", "assets/bg_dadaocheng.jpg");
    this.loadRaw("bg_train", "assets/bg_train.png?v=36");
    this.loadRaw("enemy_train_ticket", "assets/enemy_train_ticket.png?v=36");
    this.loadRaw("enemy_train_porter", "assets/enemy_train_porter.png?v=36");
    this.loadRaw("boss_train_mechanic", "assets/boss_train_mechanic.png?v=36");
    this.loadRaw("bg_lab_f1", "assets/bg_lab_f1.jpg");
    this.loadRaw("bg_lab_b1", "assets/bg_lab_b1.jpg");
    this.loadRaw("bg_lab_b2", "assets/bg_lab_b2.jpg");
    this.loadTallScrollableWorldMap(
      "assets/map_world_top.jpg?v=10",
      "assets/map_island.jpg?v=10",
      "assets/map_japan_island.jpg?v=58",
      "assets/map_sea_islands.jpg?v=59"
    );
    this.loadRaw("map_taiwan_full", "assets/map_taiwan_full.jpg?v=51");
    this.loadRaw("map_japan_full", "assets/map_japan_full.jpg?v=51");

    this.loadSprite("hero_mustache_normal", "assets/hero_mustache_normal.jpg");
    this.loadSprite("hero_mustache_buff", "assets/hero_mustache_buff.jpg");
    this.loadRaw("hero_mustache_portrait", "assets/hero_mustache_portrait.jpg?v=48");
    this.loadRaven2x4Sheet(
      "assets/hero_mustache_normal_sheet.png?v=48",
      ["must_idle", "must_atk1", "must_atk2", "must_atk3"],
      ["must_k_crouch", "must_k_jump", "must_k_slam", "must_k_ring"],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.24], [0.24, 0.48], [0.48, 0.72], [0.72, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_mustache_ult_sheet.png?v=48",
      ["must_ult_prep", "must_ult_reload", "must_ult_buff1", "must_ult_buff2"],
      ["must_ult_punch1", "must_ult_lv1", "must_ult_lv2_charge", "must_ult_lv3"],
      [[0, 0.24], [0.24, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.21], [0.21, 0.48], [0.48, 0.69], [0.69, 1.0]]
    );
    this.loadWhite1x4Sheet(
      "assets/hero_mustache_buff_k_sheet.png?v=48",
      ["must_bk_crouch", "must_bk_jump", "must_bk_slam", "must_bk_ring"],
      [[0, 0.24], [0.24, 0.46], [0.46, 0.72], [0.72, 1.0]]
    );
    this.loadSprite("hero_samurai_idle", "assets/hero_samurai_idle.jpg");
    this.loadSprite("hero_samurai_slash", "assets/hero_samurai_slash.jpg");
    this.loadDualSamuraiSheet("assets/hero_samurai_dual_sheet.jpg?v=11");
    this.loadRaw("hero_samurai_portrait", "assets/hero_samurai_portrait.jpg?v=30");
    this.loadRaven2x4Sheet(
      "assets/hero_samurai_normal_sheet.png?v=30",
      ["sam_idle", "sam_atk1", "sam_atk2", "sam_atk3"],
      ["sam_k_crouch", "sam_k_dash", "sam_k_trail", "sam_k_burst"],
      [[0, 0.22], [0.22, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.20], [0.20, 0.44], [0.44, 0.72], [0.72, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_samurai_ult_sheet.png?v=30",
      ["sam_ult_draw", "sam_ult_wave", "sam_ult_lv1", "sam_ult_lv2"],
      ["sam_dual_idle", "sam_dual_dash", "sam_dual_cross", "sam_dual_waves"],
      [[0, 0.21], [0.21, 0.49], [0.49, 0.73], [0.73, 1.0]],
      [[0, 0.21], [0.21, 0.46], [0.46, 0.70], [0.70, 1.0]]
    );
    this.loadSprite("hero_momo_normal", "assets/hero_momo_normal.jpg");
    this.loadSprite("hero_momo_vampire", "assets/hero_momo_vampire.jpg");
    this.loadRaw("hero_momo_portrait", "assets/hero_momo_portrait.jpg?v=18");
    this.loadRaw("hero_momo_vampire_portrait", "assets/hero_momo_vampire_portrait.jpg?v=20");
    this.loadRaven2x4Sheet(
      "assets/hero_momo_normal_sheet.png?v=18",
      ["momo_idle", "momo_spray_prep", "momo_spray_fire", "momo_spray_recover"],
      ["momo_blink_crouch", "momo_blink_dissolve", "momo_blink_swarm", "momo_blink_land"],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.465], [0.465, 0.74], [0.74, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_momo_vampire_sheet.png?v=20",
      ["momo_vamp_idle", "momo_vamp_claw", "momo_vamp_blink", "momo_vamp_heal"],
      ["momo_vamp_lv1_claw", "momo_vamp_lv1_wave", "momo_vamp_lv2_wave", "momo_vamp_lv3_true"],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]]
    );
    this.loadRaw("hero_raven_portrait", "assets/hero_raven_portrait.jpg?v=16");
    this.loadRaven2x4Sheet(
      "assets/hero_raven_dagger_sheet.png?v=16",
      ["raven_idle", "raven_atk1", "raven_atk2", "raven_atk3"],
      ["raven_smoke", "raven_grapple", "raven_backstab", "raven_evade"]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_raven_ult_sheet.png?v=17",
      ["raven_ult_reach", "raven_ult_draw", "raven_ult_step1", "raven_ult_step2"],
      ["raven_ult_lv1", "raven_ult_lv2", "raven_ult_lv3_kata", "raven_ult_lv3_finisher"]
    );
    this.loadRaw("hero_shaka_portrait", "assets/hero_shaka_portrait.jpg?v=21");
    this.loadRaven2x4Sheet(
      "assets/hero_shaka_normal_sheet.png?v=39",
      ["shaka_idle", "shaka_atk1", "shaka_atk2", "shaka_atk3"],
      ["shaka_k_float", "shaka_k_grab", "shaka_k_bind", "shaka_k_barrier"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.23], [0.23, 0.47], [0.47, 0.73], [0.73, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_shaka_ult_sheet.png?v=21",
      ["shaka_ult_float", "shaka_ult_idle", "shaka_ult_multi", "shaka_ult_lv1"],
      ["shaka_ult_lv2_charge", "shaka_ult_lv2_slam", "shaka_ult_lv3_array", "shaka_ult_lv3_finisher"],
      [[0, 0.23], [0.23, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.73], [0.73, 1.0]]
    );
    this.loadRaw("hero_alice_portrait", "assets/hero_alice_portrait.jpg?v=28");
    this.loadRaven2x4Sheet(
      "assets/hero_alice_normal_sheet.png?v=28",
      ["alice_idle", "alice_atk1", "alice_atk2", "alice_atk3"],
      ["alice_k_touch", "alice_k_wave", "alice_k_break", "alice_k_push"],
      [[0, 0.23], [0.23, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.48], [0.48, 0.73], [0.73, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_alice_ult_sheet.png?v=28",
      ["alice_ult_start", "alice_ult_idle", "alice_ult_dash", "alice_ult_lv1"],
      ["alice_ult_punch", "alice_ult_lv2", "alice_ult_lv3_domain", "alice_ult_lv3_snap"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.76], [0.76, 1.0]],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.75], [0.75, 1.0]]
    );
    this.loadRaw("hero_ironfist_portrait", "assets/hero_ironfist_portrait.jpg?v=32");
    this.loadRaven2x4Sheet(
      "assets/hero_ironfist_normal_sheet.png?v=32",
      ["if_idle", "if_atk1", "if_atk2", "if_atk3"],
      ["if_k_wrap", "if_k_guard", "if_k_charge", "if_k_slam"],
      [[0, 0.22], [0.22, 0.47], [0.47, 0.71], [0.71, 1.0]],
      [[0, 0.21], [0.21, 0.43], [0.43, 0.71], [0.71, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_ironfist_ult_sheet.png?v=32",
      ["if_ult_steam", "if_ult_idle", "if_ult_punch", "if_ult_lv1"],
      ["if_ult_lv2_charge", "if_ult_lv2_dash", "if_ult_lv3_launch", "if_ult_lv3_combo"],
      [[0, 0.22], [0.22, 0.46], [0.46, 0.74], [0.74, 1.0]],
      [[0, 0.20], [0.20, 0.48], [0.48, 0.70], [0.70, 1.0]]
    );
    this.loadRaw("hero_nightheron_portrait", "assets/hero_nightheron_portrait.jpg?v=33");
    this.loadRaven2x4Sheet(
      "assets/hero_nightheron_normal_sheet.png?v=33",
      ["nh_idle", "nh_atk1", "nh_atk2", "nh_atk3"],
      ["nh_k_tap", "nh_k_slide", "nh_k_kick", "nh_k_land"],
      [[0, 0.22], [0.22, 0.49], [0.49, 0.75], [0.75, 1.0]],
      [[0, 0.22], [0.22, 0.50], [0.50, 0.76], [0.76, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_nightheron_ult_sheet.png?v=33",
      ["nh_ult_tap", "nh_ult_idle", "nh_ult_kick", "nh_ult_lv1"],
      ["nh_ult_lv2_jump", "nh_ult_lv2_axe", "nh_ult_lv3_launch", "nh_ult_lv3_dive"],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.73], [0.73, 1.0]]
    );
    this.loadRaw("hero_magic_portrait", "assets/hero_magic_portrait.jpg?v=41");
    this.loadRaven2x4Sheet(
      "assets/hero_magic_normal_sheet.png?v=41",
      ["magic_idle", "magic_atk1", "magic_atk2", "magic_atk3"],
      ["magic_k_cast", "magic_k_step", "magic_k_pull", "magic_k_burst"],
      [[0, 0.23], [0.23, 0.50], [0.50, 0.74], [0.74, 1.0]],
      [[0, 0.20], [0.20, 0.46], [0.46, 0.73], [0.73, 1.0]]
    );
    this.loadBlackBg2x4Sheet(
      "assets/hero_magic_ult_sheet.jpg?v=41",
      ["magic_ult_rift", "magic_ult_idle", "magic_ult_skulls", "magic_ult_lv1"],
      ["magic_ult_lv2_pillars", "magic_ult_lv2_vortex", "magic_ult_lv3_empress", "magic_ult_lv3_beam"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.24], [0.24, 0.50], [0.50, 0.73], [0.73, 1.0]]
    );
    this.loadRaw("hero_ling_portrait", "assets/hero_ling_portrait.jpg?v=46");
    this.loadBlackBg2x4Sheet(
      "assets/hero_ling_normal_sheet.jpg?v=46",
      ["ling_idle", "ling_atk1", "ling_atk2", "ling_atk3"],
      ["ling_k_cast", "ling_k_shield", "ling_k_push", "ling_k_land"],
      [[0, 0.22], [0.22, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.22], [0.22, 0.47], [0.47, 0.75], [0.75, 1.0]]
    );
    this.loadBlackBg2x4Sheet(
      "assets/hero_ling_ult_sheet.jpg?v=46",
      ["ling_ult_start", "ling_ult_idle", "ling_ult_combo", "ling_ult_lv1"],
      ["ling_ult_lv2_fire", "ling_ult_lv2_water", "ling_ult_lv3_charge", "ling_ult_lv3_finisher"],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.75], [0.75, 1.0]],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]]
    );
    this.loadRaw("hero_rose_portrait", "assets/hero_rose_portrait.jpg?v=54");
    this.loadRaven2x4Sheet(
      "assets/hero_rose_normal_sheet.png?v=54",
      ["rose_idle", "rose_atk1", "rose_atk2", "rose_atk3"],
      ["rose_k_cast", "rose_k_wave", "rose_k_control", "rose_k_smirk"],
      [[0, 0.22], [0.22, 0.49], [0.49, 0.72], [0.72, 1.0]],
      [[0, 0.22], [0.22, 0.50], [0.50, 0.76], [0.76, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_rose_ult_sheet.png?v=54",
      ["rose_ult_mass", "rose_ult_idle", "rose_ult_lv1_flurry", "rose_ult_lv1_beam"],
      ["rose_ult_lv2_charge", "rose_ult_lv2_ring", "rose_ult_lv3_charge", "rose_ult_lv3_finisher"],
      [[0, 0.26], [0.26, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.19], [0.19, 0.46], [0.46, 0.69], [0.69, 1.0]]
    );
    this.loadRaw("hero_fallen_portrait", "assets/hero_fallen_portrait.jpg?v=62");
    this.loadBlackBg2x4Sheet(
      "assets/hero_fallen_normal_sheet.jpg?v=62",
      ["fallen_idle", "fallen_atk1", "fallen_atk2", "fallen_atk3"],
      ["fallen_k_rise", "fallen_k_slash", "fallen_k_pillar", "fallen_k_land"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.24], [0.24, 0.50], [0.50, 0.75], [0.75, 1.0]]
    );
    this.loadBlackBg2x4Sheet(
      "assets/hero_fallen_ult_sheet.jpg?v=62",
      ["fallen_ult_awake", "fallen_ult_idle", "fallen_ult_lv1_slash", "fallen_ult_lv1_wave"],
      ["fallen_ult_lv2_charge", "fallen_ult_lv2_slam", "fallen_ult_lv3_charge", "fallen_ult_lv3_finisher"],
      [[0, 0.25], [0.25, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.24], [0.24, 0.50], [0.50, 0.75], [0.75, 1.0]]
    );
    this.loadBlackBg1x4Vfx("assets/vfx_fallen_skull_drop.jpg?v=62", [
      "vfx_fallen_sigil",
      "vfx_fallen_skull",
      "vfx_fallen_pillar",
      "vfx_fallen_burst",
    ]);
    this.loadBlackBg1x4Vfx("assets/vfx_shaka_palm_drop.jpg?v=63", [
      "vfx_shaka_sigil",
      "vfx_shaka_strike",
      "vfx_shaka_pillar",
      "vfx_shaka_burst",
    ]);
    this.loadBlackBg1x4Vfx("assets/vfx_magic_abyss_claw.jpg?v=63", [
      "vfx_magic_sigil",
      "vfx_magic_strike",
      "vfx_magic_pillar",
      "vfx_magic_burst",
    ]);
    this.loadBlackBg1x4Vfx("assets/vfx_rose_inferno_pillar.jpg?v=63", [
      "vfx_rose_sigil",
      "vfx_rose_strike",
      "vfx_rose_pillar",
      "vfx_rose_burst",
    ]);
    this.loadBlackBg1x4Vfx("assets/vfx_ling_four_beasts.jpg?v=63", [
      "vfx_ling_sigil",
      "vfx_ling_strike",
      "vfx_ling_pillar",
      "vfx_ling_burst",
    ]);
    this.loadBlackBg1x4Vfx("assets/vfx_flying_slash.jpg?v=66", [
      "vfx_slash_cyan",
      "vfx_slash_purple",
      "vfx_slash_fire",
      "vfx_slash_gold",
    ]);
    this.buildRoseFireFistSprites();
    this.loadWhite1x4Sheet(
      "assets/vfx_rose_firefist.png?v=69",
      ["vfx_firefist_lv1", "vfx_firefist_lv2", "vfx_firefist_lv3"],
      [
        [0, 1 / 3],
        [1 / 3, 2 / 3],
        [2 / 3, 1],
      ]
    );
    this.loadWhite1x4Sheet(
      "assets/vfx_proj_pack_a.png?v=70",
      ["vfx_proj_magic", "vfx_proj_raven", "vfx_proj_momo", "vfx_proj_nightheron"]
    );
    this.loadWhite1x4Sheet(
      "assets/vfx_proj_pack_b.png?v=70",
      ["vfx_proj_fallen", "vfx_proj_ling", "vfx_proj_ironfist", "vfx_proj_shaka"]
    );
    this.loadWhite1x4Sheet(
      "assets/vfx_raven_ult_pack.png?v=71",
      ["vfx_raven_bullet", "vfx_raven_shuriken", "vfx_raven_eclipse_x"],
      [
        [0, 1 / 3],
        [1 / 3, 2 / 3],
        [2 / 3, 1],
      ]
    );
    this.loadWhite1x4Sheet(
      "assets/vfx_proj_pack_c.png?v=71",
      ["vfx_proj_alice", "vfx_momo_pepper", "vfx_momo_bats", "vfx_proj_mustache"]
    );
    this.loadWhite1x4Sheet(
      "assets/vfx_mist_pack.png?v=73",
      ["vfx_mist_pepper", "vfx_mist_blood", "vfx_mist_poison"],
      [
        [0, 1 / 3],
        [1 / 3, 2 / 3],
        [2 / 3, 1],
      ]
    );
    this.loadSprite("enemy_agent", "assets/enemy_agent.jpg");
    this.loadSprite("enemy_boss", "assets/enemy_boss.jpg");
    this.loadSprite("enemy_mutant_dog", "assets/enemy_mutant_dog.jpg");
    this.loadSprite("enemy_mutant_brute", "assets/enemy_mutant_brute.jpg");
    this.loadSprite("enemy_skull_human", "assets/enemy_skull_human.jpg");
    this.loadSprite("boss_genex_p1", "assets/boss_genex_p1.jpg");
    this.loadSprite("boss_genex_p2", "assets/boss_genex_p2.jpg");
    this.loadSprite("boss_genex_p3", "assets/boss_genex_p3.jpg");
    this.loadSprite("boss_ironfist", "assets/boss_ironfist.jpg");
    this.loadSprite("boss_nightheron", "assets/boss_nightheron.jpg");
    this.loadSprite("enemy_89_knife", "assets/enemy_89_knife.jpg");
    this.loadSprite("enemy_89_bat", "assets/enemy_89_bat.jpg");
    this.loadSprite("boss_89_king", "assets/boss_89_king.jpg");
    this.loadSprite("prop_brisket", "assets/prop_brisket.jpg");
    this.loadWhite1x4Sheet("assets/prop_smoker.png?v=57", ["prop_smoker"], [[0, 1]]);

    this.loadPixelButtonSheet("momo", "assets/momo_buttons_sheet.jpg?v=3");
    this.loadSinglePixelButton("samurai", "ult", "assets/samurai_btn_ult.jpg?v=30");
    this.loadSinglePixelButton("samurai", "jump", "assets/samurai_btn_jump.jpg?v=31");
    this.loadSinglePixelButton("samurai", "atk", "assets/samurai_btn_atk.jpg?v=30");
    this.loadPixelButtonSheet("mustache", "assets/mustache_buttons_sheet.jpg?v=3");
    this.loadPixelButtonSheet("raven", "assets/raven_buttons_sheet.jpg?v=16");
    this.loadSinglePixelButton("shaka", "ult", "assets/shaka_btn_ult.jpg?v=21");
    this.loadSinglePixelButton("shaka", "jump", "assets/shaka_btn_jump.jpg?v=22");
    this.loadSinglePixelButton("shaka", "atk", "assets/shaka_btn_atk.jpg?v=21");
    this.loadPixelButtonSheet("alice", "assets/alice_buttons_sheet.jpg?v=28");
    this.loadPixelButtonSheet("ironfist", "assets/ironfist_buttons_sheet.jpg?v=32");
    this.loadPixelButtonSheet("nightheron", "assets/nightheron_buttons_sheet.jpg?v=33");
    this.loadPixelButtonSheet("magic", "assets/magic_buttons_sheet.jpg?v=41");
    this.loadPixelButtonSheet("ling", "assets/ling_buttons_sheet.jpg?v=46");
    this.loadPixelButtonSheet("rose", "assets/rose_buttons_sheet.jpg?v=54");
    this.loadPixelButtonSheet("fallen", "assets/fallen_buttons_sheet.jpg?v=62");
    this.load3x3AuraSheet("assets/ult_auras_3x3.jpg?v=43", [
      "aura_mustache", "aura_samurai", "aura_momo",
      "aura_raven", "aura_shaka", "aura_alice",
      "aura_ironfist", "aura_nightheron", "aura_magic",
    ]);
    this.loadSingleAura("aura_ling", "assets/aura_ling.jpg?v=47");
    this.loadSingleAura("aura_rose", "assets/aura_rose.jpg?v=54");
    this.loadSingleAura("aura_fallen", "assets/aura_fallen.jpg?v=62");

    // 12 Full-Screen Bespoke AAA Character Select Artworks
    for (const cid of ["mustache", "samurai", "momo", "raven", "shaka", "alice", "ironfist", "nightheron", "magic", "ling", "rose", "fallen"]) {
      this.loadRaw(`select_${cid}`, `assets/select_${cid}.jpg?v=65`);
    }
  }

  // Slice & pixelate a 2x2 character skill button sheet (TR=ult, BL=jump, BR=atk) into crisp 32-bit pixel art!
  loadPixelButtonSheet(prefix, src) {
    const img = new Image();
    img.onload = () => {
      const halfW = img.width / 2;
      const halfH = img.height / 2;
      const slices = [
        { id: "ult", sx: halfW, sy: 0, sw: halfW, sh: halfH },
        { id: "jump", sx: 0, sy: halfH, sw: halfW, sh: halfH },
        { id: "atk", sx: halfW, sy: halfH, sw: halfW, sh: halfH },
      ];
      const full = document.createElement("canvas");
      full.width = img.width;
      full.height = img.height;
      const fctx = full.getContext("2d", { willReadFrequently: true });
      fctx.drawImage(img, 0, 0);
      const fd = fctx.getImageData(0, 0, img.width, img.height).data;
      for (const s of slices) {
        // Auto-detect the exact circular icon bounding box inside this quadrant (eliminates black margins & off-center rims!)
        const x0 = Math.floor(s.sx), y0 = Math.floor(s.sy);
        const x1 = Math.min(img.width, Math.ceil(s.sx + s.sw));
        const y1 = Math.min(img.height, Math.ceil(s.sy + s.sh));
        let minX = x1, maxX = x0, minY = y1, maxY = y0;
        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const idx = (y * img.width + x) * 4;
            if (fd[idx] + fd[idx + 1] + fd[idx + 2] > 36) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        let cropX = s.sx, cropY = s.sy, cropW = s.sw, cropH = s.sh;
        if (maxX - minX > s.sw * 0.45 && maxY - minY > s.sh * 0.45) {
          const side = Math.max(maxX - minX, maxY - minY);
          const midX = (minX + maxX) * 0.5;
          const midY = (minY + maxY) * 0.5;
          cropX = Math.max(0, midX - side * 0.5);
          cropY = Math.max(0, midY - side * 0.5);
          cropW = Math.min(img.width - cropX, side);
          cropH = Math.min(img.height - cropY, side);
        }

        const pSize = 52;
        const small = document.createElement("canvas");
        small.width = pSize;
        small.height = pSize;
        const sctx = small.getContext("2d", { willReadFrequently: true });
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = "high";
        sctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, pSize, pSize);

        const idata = sctx.getImageData(0, 0, pSize, pSize);
        const d = idata.data;
        const cx = pSize / 2;
        const cy = pSize / 2;
        const maxR = pSize * 0.49;
        for (let y = 0; y < pSize; y++) {
          for (let x = 0; x < pSize; x++) {
            const idx = (y * pSize + x) * 4;
            if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
              d[idx + 3] = 0;
              continue;
            }
            d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
            d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
            d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
          }
        }
        sctx.putImageData(idata, 0, 0);

        const out = document.createElement("canvas");
        out.width = pSize * 3;
        out.height = pSize * 3;
        const octx = out.getContext("2d");
        octx.imageSmoothingEnabled = false;
        octx.drawImage(small, 0, 0, out.width, out.height);

        const dataUrl = out.toDataURL("image/png");
        document.documentElement.style.setProperty(`--${prefix}-btn-${s.id}`, `url(${dataUrl})`);
      }
    };
    img.src = src;
  }

  get(name) {
    return this.images[name] || null;
  }

  // Load a single square circular skill button image & pixelate into crisp 32-bit arcade icon
  loadSinglePixelButton(prefix, id, src) {
    const img = new Image();
    img.onload = () => {
      const pSize = 52;
      const small = document.createElement("canvas");
      small.width = pSize;
      small.height = pSize;
      const sctx = small.getContext("2d", { willReadFrequently: true });
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, pSize, pSize);
      const idata = sctx.getImageData(0, 0, pSize, pSize);
      const d = idata.data;
      const cx = pSize / 2, cy = pSize / 2, maxR = pSize * 0.49;
      for (let y = 0; y < pSize; y++) {
        for (let x = 0; x < pSize; x++) {
          const idx = (y * pSize + x) * 4;
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
            d[idx + 3] = 0;
            continue;
          }
          d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
          d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
          d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
        }
      }
      sctx.putImageData(idata, 0, 0);
      const out = document.createElement("canvas");
      out.width = pSize * 3;
      out.height = pSize * 3;
      const octx = out.getContext("2d");
      octx.imageSmoothingEnabled = false;
      octx.drawImage(small, 0, 0, out.width, out.height);
      document.documentElement.style.setProperty(`--${prefix}-btn-${id}`, `url(${out.toDataURL("image/png")})`);
    };
    img.src = src;
  }

  // Slice & chroma-key Shaka's 2x4 Normal Sheet (soft neutral-grey smoky background -> transparent!)
  loadShakaGrey2x4Sheet(src, row0Names, row1Names) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const cellW = Math.floor(w / 4);
      const halfH = Math.floor(h / 2);
      const rows = [
        { y0: 0, y1: halfH, names: row0Names },
        { y0: halfH, y1: h, names: row1Names },
      ];

      for (const row of rows) {
        for (let col = 0; col < 4; col++) {
          const x0 = col * cellW;
          const cw = col === 3 ? w - x0 : cellW;
          const ch = row.y1 - row.y0;
          const off = document.createElement("canvas");
          off.width = cw;
          off.height = ch;
          const octx = off.getContext("2d", { willReadFrequently: true });
          octx.drawImage(img, x0, row.y0, cw, ch, 0, 0, cw, ch);
          const id = octx.getImageData(0, 0, cw, ch);
          const d = id.data;

          // Neutral smoky grey background detection (low saturation, cool/neutral tint; preserves warm cream/gold robes)
          const isGreyBg = (idx) => {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const lum = (r + g + b) / 3;
            return (maxC - minC) <= 22 && lum >= 82 && lum <= 232 && (r - b) <= 13;
          };

          const visited = new Uint8Array(cw * ch);
          const q = new Int32Array(cw * ch);
          let qh = 0, qt = 0;
          const enq = (x, y) => {
            if (x < 0 || y < 0 || x >= cw || y >= ch) return;
            const p = y * cw + x;
            if (visited[p]) return;
            if (isGreyBg(p * 4)) {
              visited[p] = 1;
              d[p * 4 + 3] = 0;
              q[qt++] = p;
            }
          };
          for (let x = 0; x < cw; x++) { enq(x, 0); enq(x, ch - 1); }
          for (let y = 0; y < ch; y++) { enq(0, y); enq(cw - 1, y); }
          while (qh < qt) {
            const p = q[qh++];
            const x = p % cw, y = (p - x) / cw;
            enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
          }

          // Clear enclosed neutral grey pockets (inside golden halo, between spectral arms, between ankles)
          // Seed from strictly neutral grey interior pixels and flood-fill to clean the pocket cleanly up to outlines
          qh = 0; qt = 0;
          for (let p = 0; p < cw * ch; p++) {
            if (!visited[p]) {
              const idx = p * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              const lum = (r + g + b) / 3;
              if ((maxC - minC) <= 14 && lum >= 108 && lum <= 228 && Math.abs(r - b) <= 9) {
                visited[p] = 1;
                d[idx + 3] = 0;
                q[qt++] = p;
              }
            }
          }
          while (qh < qt) {
            const p = q[qh++];
            const x = p % cw, y = (p - x) / cw;
            const nbrs = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
            for (const [nx, ny] of nbrs) {
              if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
              const np = ny * cw + nx;
              if (visited[np]) continue;
              const nidx = np * 4;
              const r = d[nidx], g = d[nidx + 1], b = d[nidx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              const lum = (r + g + b) / 3;
              if ((maxC - minC) <= 20 && lum >= 92 && lum <= 234 && (r - b) <= 12) {
                visited[np] = 1;
                d[nidx + 3] = 0;
                q[qt++] = np;
              }
            }
          }

          // 1-pass grey-fringe despill on edge pixels touching transparency
          for (let y = 1; y < ch - 1; y++) {
            for (let x = 1; x < cw - 1; x++) {
              const p = y * cw + x;
              const idx = p * 4;
              if (d[idx + 3] === 0) continue;
              const touchesBg =
                d[((y - 1) * cw + x) * 4 + 3] === 0 ||
                d[((y + 1) * cw + x) * 4 + 3] === 0 ||
                d[(y * cw + (x - 1)) * 4 + 3] === 0 ||
                d[(y * cw + (x + 1)) * 4 + 3] === 0;
              if (touchesBg) {
                const r = d[idx], g = d[idx + 1], b = d[idx + 2];
                const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
                const lum = (r + g + b) / 3;
                if ((maxC - minC) <= 18 && lum >= 100 && (r - b) <= 12) {
                  d[idx + 3] = 0;
                }
              }
            }
          }

          // Remove tiny disconnected floating specks (e.g. shadow dots below feet or stray aura dust)
          const compSeen = new Uint8Array(cw * ch);
          const compBuf = new Int32Array(cw * ch);
          for (let p = 0; p < cw * ch; p++) {
            if (compSeen[p] || d[p * 4 + 3] <= 24) continue;
            let chHead = 0, chTail = 0;
            compSeen[p] = 1;
            compBuf[chTail++] = p;
            while (chHead < chTail) {
              const cp = compBuf[chHead++];
              const cx = cp % cw, cy = (cp - cx) / cw;
              const nbrs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
              for (const [nx, ny] of nbrs) {
                if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
                const np = ny * cw + nx;
                if (compSeen[np] || d[np * 4 + 3] <= 24) continue;
                compSeen[np] = 1;
                compBuf[chTail++] = np;
              }
            }
            if (chTail < 45) {
              for (let k = 0; k < chTail; k++) {
                d[compBuf[k] * 4 + 3] = 0;
              }
            }
          }
          octx.putImageData(id, 0, 0);

          let minX = cw, maxX = 0, minY = ch, maxY = 0;
          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              if (d[(y * cw + x) * 4 + 3] > 24) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX <= minX || maxY <= minY) continue;
          const tw = maxX - minX + 1;
          const th = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = tw;
          out.height = th;
          out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
          this.images[row.names[col]] = out;
        }
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }

  // Synthesize crisp 32-bit pixel-art 3-tier Flying Blazing Fire Fist sprites for Rose (Lv.1 / Lv.2 / Lv.3)!
  buildRoseFireFistSprites() {
    const makeFist = (tier) => {
      const pw = tier === 3 ? 92 : tier === 2 ? 78 : 66;
      const ph = tier === 3 ? 62 : tier === 2 ? 52 : 44;
      const c = document.createElement("canvas");
      c.width = pw;
      c.height = ph;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      const cy = Math.floor(ph / 2);

      // 1. Blazing trailing comet flames (shooting right -> tail to left)
      const tailLen = Math.floor(pw * 0.62);
      const fistX = Math.floor(pw * 0.64);
      const outerGrad = g.createLinearGradient(2, cy, pw - 2, cy);
      outerGrad.addColorStop(0, "rgba(185, 28, 28, 0)");
      outerGrad.addColorStop(0.28, "rgba(220, 38, 38, 0.78)");
      outerGrad.addColorStop(0.62, "#f97316");
      outerGrad.addColorStop(0.88, "#fde047");
      outerGrad.addColorStop(1, "#ffffff");

      // Outer roaring flame silhouette
      g.fillStyle = outerGrad;
      g.beginPath();
      g.moveTo(2, cy);
      g.quadraticCurveTo(tailLen * 0.45, cy - ph * 0.46, fistX + 6, cy - ph * 0.34);
      g.quadraticCurveTo(pw - 1, cy - ph * 0.16, pw - 2, cy);
      g.quadraticCurveTo(pw - 1, cy + ph * 0.18, fistX + 6, cy + ph * 0.34);
      g.quadraticCurveTo(tailLen * 0.45, cy + ph * 0.46, 2, cy);
      g.closePath();
      g.fill();

      // Dynamic jagged flame tongues streaming backward
      g.fillStyle = "#ea580c";
      const tongues = [
        [fistX - 6, cy - ph * 0.28, 10, cy - ph * 0.42, fistX - 18, cy - ph * 0.14],
        [fistX - 8, cy + ph * 0.28, 12, cy + ph * 0.42, fistX - 18, cy + ph * 0.14],
        [fistX - 16, cy - ph * 0.12, 4, cy - ph * 0.22, fistX - 24, cy],
        [fistX - 16, cy + ph * 0.12, 4, cy + ph * 0.22, fistX - 24, cy],
      ];
      for (const [x1, y1, x2, y2, x3, y3] of tongues) {
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.lineTo(x3, y3);
        g.closePath();
        g.fill();
      }

      // 2. Sculpted Clenched Fiery Fist (back of hand + 4 knuckles + curled thumb facing RIGHT!)
      const fw = Math.floor(pw * 0.34);
      const fh = Math.floor(ph * 0.56);
      const fx = fistX - Math.floor(fw * 0.32);
      const fy = cy - Math.floor(fh / 2);

      // Fiery orange-gold fist base body
      const fistGrad = g.createLinearGradient(fx, fy, fx + fw, fy + fh);
      fistGrad.addColorStop(0, "#fb923c");
      fistGrad.addColorStop(0.55, "#fde047");
      fistGrad.addColorStop(1, "#ffffff");
      g.fillStyle = fistGrad;
      g.fillRect(fx, fy + 2, fw - 3, fh - 4);

      // 4 protruding punch knuckles on the leading right edge
      const knH = Math.max(4, Math.floor((fh - 6) / 4));
      for (let k = 0; k < 4; k++) {
        const ky = fy + 2 + k * knH;
        g.fillStyle = "#fef9c3";
        g.fillRect(fx + fw - 7, ky + 1, 7, knH - 1);
        // Dark ember knuckle crease for unmistakable fist readability!
        g.fillStyle = "#9a3412";
        g.fillRect(fx + fw - 9, ky, 7, 1);
        g.fillRect(fx + fw - 10, ky + 1, 2, knH - 1);
      }

      // Curled thumb locked along bottom-front of fist
      g.fillStyle = "#fde047";
      g.fillRect(fx + 3, fy + fh - Math.floor(fh * 0.30), Math.floor(fw * 0.62), Math.floor(fh * 0.28));
      g.fillStyle = "#9a3412";
      g.fillRect(fx + 3, fy + fh - Math.floor(fh * 0.32), Math.floor(fw * 0.62), 2);

      // Glowing incandescent white-hot leading edge highlight
      g.fillStyle = "#ffffff";
      g.fillRect(fx + fw - 3, fy + 4, 3, fh - 8);

      // 3. Lv.2 / Lv.3 Hot-Pink Psychic Lightning & Vortex Arcs!
      if (tier >= 2) {
        g.strokeStyle = "#f472b6";
        g.lineWidth = tier === 3 ? 2 : 1.5;
        g.beginPath();
        g.moveTo(8, cy - ph * 0.22);
        g.lineTo(tailLen * 0.55, cy - ph * 0.36);
        g.lineTo(fistX, cy - ph * 0.24);
        g.moveTo(10, cy + ph * 0.22);
        g.lineTo(tailLen * 0.55, cy + ph * 0.36);
        g.lineTo(fistX, cy + ph * 0.24);
        g.stroke();
      }
      if (tier >= 3) {
        g.strokeStyle = "#fef08a";
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(fistX + 2, cy, fw * 0.55, ph * 0.44, 0, -Math.PI * 0.55, Math.PI * 0.55);
        g.stroke();
      }
      return c;
    };

    this.images["vfx_firefist_lv1"] = makeFist(1);
    this.images["vfx_firefist_lv2"] = makeFist(2);
    this.images["vfx_firefist_lv3"] = makeFist(3);
  }

  // Slice a 1x4 pure-black (#000000) VFX strip into 4 additive-ready trimmed sprites!
  loadBlackBg1x4Vfx(src, names) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const colW = img.width / names.length;
      const ch = img.height;
      for (let i = 0; i < names.length; i++) {
        const sx = Math.floor(i * colW);
        const sw = Math.floor(colW);
        const off = document.createElement("canvas");
        off.width = sw;
        off.height = ch;
        const octx = off.getContext("2d", { willReadFrequently: true });
        octx.drawImage(img, sx, 0, sw, ch, 0, 0, sw, ch);
        const id = octx.getImageData(0, 0, sw, ch);
        const d = id.data;
        let minX = sw, maxX = 0, minY = ch, maxY = 0;
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
            if (maxC <= 14) {
              d[idx + 3] = 0;
            } else if (maxC < 62) {
              d[idx + 3] = Math.round(((maxC - 14) / 48) * 255);
            } else {
              d[idx + 3] = 255;
            }
            if (d[idx + 3] > 28) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        octx.putImageData(id, 0, 0);
        if (maxX > minX && maxY > minY) {
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = bw;
          out.height = bh;
          out.getContext("2d").drawImage(off, minX, minY, bw, bh, 0, 0, bw, bh);
          this.images[names[i]] = out;
        }
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }


  // Load a single 1:1 Pure-Black-Background Ultimate Magic Aura Ring into a centered transparent disc!
  loadSingleAura(name, src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const cw = img.width;
      const ch = img.height;
      const off = document.createElement("canvas");
      off.width = cw;
      off.height = ch;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, cw, ch);
      const d = id.data;
      let minX = cw, maxX = 0, minY = ch, maxY = 0;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const idx = (y * cw + x) * 4;
          const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
          if (maxC <= 14) {
            d[idx + 3] = 0;
          } else if (maxC < 64) {
            d[idx + 3] = Math.round(((maxC - 14) / 50) * 255);
          } else {
            d[idx + 3] = 255;
          }
          if (d[idx + 3] > 28) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      octx.putImageData(id, 0, 0);
      if (maxX > minX && maxY > minY) {
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const side = Math.max(bw, bh);
        const out = document.createElement("canvas");
        out.width = side;
        out.height = side;
        const dx = Math.floor((side - bw) / 2);
        const dy = Math.floor((side - bh) / 2);
        out.getContext("2d").drawImage(off, minX, minY, bw, bh, dx, dy, bw, bh);
        this.images[name] = out;
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Slice 3x3 Pure-Black-Background Ultimate Magic Aura Ring Sheet using automatic gap projection
  // so uneven margins never clip tips or bleed adjacent rings!
  load3x3AuraSheet(src, names) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const full = document.createElement("canvas");
      full.width = w;
      full.height = h;
      const fctx = full.getContext("2d", { willReadFrequently: true });
      fctx.drawImage(img, 0, 0);
      const fid = fctx.getImageData(0, 0, w, h);
      const fd = fid.data;

      // 1. Find 3 exact vertical row bands by finding black-gap valleys in row projection
      const rowEnergy = new Int32Array(h);
      for (let y = 0; y < h; y++) {
        let cnt = 0;
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (Math.max(fd[idx], fd[idx + 1], fd[idx + 2]) > 24) cnt++;
        }
        rowEnergy[y] = cnt;
      }
      const findBands = (energy, len, expected) => {
        const bands = [];
        let inBand = false, start = 0;
        for (let i = 0; i < len; i++) {
          if (energy[i] > 6 && !inBand) {
            inBand = true;
            start = i;
          } else if (energy[i] <= 6 && inBand) {
            if (i - start > 40) bands.push([start, i]);
            inBand = false;
          }
        }
        if (inBand && len - start > 40) bands.push([start, len]);
        if (bands.length === expected) return bands;
        // Fallback: split by local minima around 1/3 and 2/3 of active span
        const first = energy.findIndex((v) => v > 6);
        let last = len - 1;
        while (last > first && energy[last] <= 6) last--;
        const span = Math.max(1, last - first);
        const minIn = (lo, hi) => {
          let best = lo, bestV = Infinity;
          for (let i = Math.max(0, lo); i <= Math.min(len - 1, hi); i++) {
            if (energy[i] < bestV) { bestV = energy[i]; best = i; }
          }
          return best;
        };
        const s1 = minIn(Math.floor(first + span * 0.26), Math.floor(first + span * 0.40));
        const s2 = minIn(Math.floor(first + span * 0.60), Math.floor(first + span * 0.74));
        return [[Math.max(0, first - 2), s1], [s1, s2], [s2, Math.min(len, last + 2)]];
      };

      const rowBands = findBands(rowEnergy, h, 3);

      for (let row = 0; row < 3; row++) {
        const [ry0, ry1] = rowBands[row];
        // 2. Find 3 exact horizontal column bands inside this row
        const colEnergy = new Int32Array(w);
        for (let x = 0; x < w; x++) {
          let cnt = 0;
          for (let y = ry0; y < ry1; y++) {
            const idx = (y * w + x) * 4;
            if (Math.max(fd[idx], fd[idx + 1], fd[idx + 2]) > 24) cnt++;
          }
          colEnergy[x] = cnt;
        }
        const colBands = findBands(colEnergy, w, 3);

        for (let col = 0; col < 3; col++) {
          const i = row * 3 + col;
          if (i >= names.length) continue;
          const [cx0, cx1] = colBands[col];
          const cw = Math.max(1, cx1 - cx0);
          const ch = Math.max(1, ry1 - ry0);
          const off = document.createElement("canvas");
          off.width = cw;
          off.height = ch;
          const octx = off.getContext("2d", { willReadFrequently: true });
          octx.drawImage(img, cx0, ry0, cw, ch, 0, 0, cw, ch);
          const id = octx.getImageData(0, 0, cw, ch);
          const d = id.data;
          let minX = cw, maxX = 0, minY = ch, maxY = 0;
          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              const idx = (y * cw + x) * 4;
              const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
              if (maxC <= 14) {
                d[idx + 3] = 0;
              } else if (maxC < 64) {
                d[idx + 3] = Math.round(((maxC - 14) / 50) * 255);
              } else {
                d[idx + 3] = 255;
              }
              if (d[idx + 3] > 28) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          octx.putImageData(id, 0, 0);
          if (maxX <= minX || maxY <= minY) continue;
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          const side = Math.max(bw, bh);
          const out = document.createElement("canvas");
          out.width = side;
          out.height = side;
          const dx = Math.floor((side - bw) / 2);
          const dy = Math.floor((side - bh) / 2);
          out.getContext("2d").drawImage(off, minX, minY, bw, bh, dx, dy, bw, bh);
          this.images[names[i]] = out;
        }
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Slice & chroma-key 2x4 (8-frame) Pure-Black-Background Sprite Sheets (e.g. Magic Ultimate)!
  loadBlackBg2x4Sheet(src, row0Names, row1Names, row0Ratios = null, row1Ratios = null) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const halfH = Math.floor(h / 2);
      const rows = [
        { y0: 0, y1: halfH, names: row0Names, ratios: row0Ratios },
        { y0: halfH, y1: h, names: row1Names, ratios: row1Ratios },
      ];
      for (const row of rows) {
        for (let col = 0; col < 4; col++) {
          const x0 = row.ratios ? Math.floor(w * row.ratios[col][0]) : Math.floor((w * col) / 4);
          const x1 = row.ratios ? Math.floor(w * row.ratios[col][1]) : Math.floor((w * (col + 1)) / 4);
          const cw = Math.max(1, x1 - x0);
          const ch = Math.max(1, row.y1 - row.y0);
          const off = document.createElement("canvas");
          off.width = cw;
          off.height = ch;
          const octx = off.getContext("2d", { willReadFrequently: true });
          octx.drawImage(img, x0, row.y0, cw, ch, 0, 0, cw, ch);
          const id = octx.getImageData(0, 0, cw, ch);
          const d = id.data;

          const isBlackBg = (idx) => {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            return r <= 20 && g <= 20 && b <= 24;
          };

          const visited = new Uint8Array(cw * ch);
          const q = new Int32Array(cw * ch);
          let qh = 0, qt = 0;
          const enq = (x, y) => {
            if (x < 0 || y < 0 || x >= cw || y >= ch) return;
            const p = y * cw + x;
            if (visited[p]) return;
            if (isBlackBg(p * 4)) {
              visited[p] = 1;
              d[p * 4 + 3] = 0;
              q[qt++] = p;
            }
          };
          for (let x = 0; x < cw; x++) { enq(x, 0); enq(x, ch - 1); }
          for (let y = 0; y < ch; y++) { enq(0, y); enq(cw - 1, y); }
          while (qh < qt) {
            const p = q[qh++];
            const x = p % cw, y = (p - x) / cw;
            enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
          }

          // Clear enclosed pure-black pockets inside magic circles & rift frames
          for (let p = 0; p < cw * ch; p++) {
            if (!visited[p]) {
              const idx = p * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              if (r <= 12 && g <= 12 && b <= 15) {
                d[idx + 3] = 0;
              }
            }
          }

          // Smooth dark-glow feathering on pixels bordering transparency
          for (let y = 1; y < ch - 1; y++) {
            for (let x = 1; x < cw - 1; x++) {
              const p = y * cw + x;
              const idx = p * 4;
              if (d[idx + 3] === 0) continue;
              const touchesBg =
                d[((y - 1) * cw + x) * 4 + 3] === 0 ||
                d[((y + 1) * cw + x) * 4 + 3] === 0 ||
                d[(y * cw + (x - 1)) * 4 + 3] === 0 ||
                d[(y * cw + (x + 1)) * 4 + 3] === 0;
              if (touchesBg) {
                const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
                if (maxC < 48) {
                  d[idx + 3] = Math.round((maxC / 48) * 210);
                }
              }
            }
          }
          octx.putImageData(id, 0, 0);

          let minX = cw, maxX = 0, minY = ch, maxY = 0;
          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              if (d[(y * cw + x) * 4 + 3] > 28) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX <= minX || maxY <= minY) continue;
          const tw = maxX - minX + 1;
          const th = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = tw;
          out.height = th;
          out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
          this.images[row.names[col]] = out;
        }
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Slice & chroma-key a 1x4 White/Transparent Sprite Strip (e.g. Mustache Hero Buff Small Skill K)!
  loadWhite1x4Sheet(src, names, ratios = null) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, w, h);
      const d = id.data;
      const isWhiteBg = (idx) => {
        if (d[idx + 3] < 20) return true;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return r > 236 && g > 236 && b > 236 && Math.max(r, g, b) - Math.min(r, g, b) < 16;
      };
      const visited = new Uint8Array(w * h);
      const q = new Int32Array(w * h);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        if (isWhiteBg(p * 4)) {
          visited[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < w; x++) { enq(x, 0); enq(x, h - 1); }
      for (let y = 0; y < h; y++) { enq(0, y); enq(w - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % w, y = (p - x) / w;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }
      octx.putImageData(id, 0, 0);
      for (let col = 0; col < names.length; col++) {
        const x0 = ratios ? Math.floor(w * ratios[col][0]) : Math.floor((w * col) / 4);
        const x1 = ratios ? Math.floor(w * ratios[col][1]) : Math.floor((w * (col + 1)) / 4);
        let minX = x1, maxX = x0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = x0; x < x1; x++) {
            if (d[(y * w + x) * 4 + 3] > 24) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX <= minX || maxY <= minY) continue;
        const tw = maxX - minX + 1;
        const th = maxY - minY + 1;
        const out = document.createElement("canvas");
        out.width = tw;
        out.height = th;
        out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
        this.images[names[col]] = out;
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Slice & chroma-key 2x4 (8-frame) White-Background Sprite Sheets (Raven / Momo)!
  loadRaven2x4Sheet(src, row0Names, row1Names, row0Ratios = null, row1Ratios = null) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, w, h);
      const d = id.data;

      // Remove pure/near-white background via BFS from borders & interior pure-white gaps
      const isWhiteBg = (idx) => {
        const a = d[idx + 3];
        if (a < 20) return true;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return r > 236 && g > 236 && b > 236 && Math.max(r, g, b) - Math.min(r, g, b) < 16;
      };

      const visited = new Uint8Array(w * h);
      const q = new Int32Array(w * h);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        if (isWhiteBg(p * 4)) {
          visited[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < w; x++) { enq(x, 0); enq(x, h - 1); }
      for (let y = 0; y < h; y++) { enq(0, y); enq(w - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % w, y = (p - x) / w;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }

      // Also clear enclosed pure-white gaps between legs/arms/braids (tight threshold so white shirt collar stays intact!)
      for (let p = 0; p < w * h; p++) {
        if (!visited[p]) {
          const idx = p * 4;
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          if (r > 248 && g > 248 && b > 248) {
            d[idx + 3] = 0;
          }
        }
      }
      octx.putImageData(id, 0, 0);

      const halfH = Math.floor(h / 2);
      const rows = [
        { y0: 0, y1: halfH, names: row0Names, ratios: row0Ratios },
        { y0: halfH, y1: h, names: row1Names, ratios: row1Ratios },
      ];

      for (const row of rows) {
        let finalSpans;
        if (row.ratios) {
          finalSpans = row.ratios.map(([r0, r1]) => [Math.floor(w * r0), Math.min(w - 1, Math.floor(w * r1) - 1)]);
        } else {
          // Auto-detect 4 horizontal spans in this row so wide frames never clip!
          const colHasPx = new Uint8Array(w);
          for (let x = 0; x < w; x++) {
            let cnt = 0;
            for (let y = row.y0; y < row.y1; y++) {
              if (d[(y * w + x) * 4 + 3] > 24) cnt++;
            }
            if (cnt >= 3) colHasPx[x] = 1;
          }
          const spans = [];
          let inSpan = false, sStart = 0;
          for (let x = 0; x < w; x++) {
            if (colHasPx[x] && !inSpan) {
              inSpan = true;
              sStart = x;
            } else if (!colHasPx[x] && inSpan) {
              inSpan = false;
              if (x - sStart > 24) spans.push([sStart, x - 1]);
            }
          }
          if (inSpan && w - sStart > 24) spans.push([sStart, w - 1]);

          const cellW = Math.floor(w / 4);
          finalSpans =
            spans.length === 4
              ? spans
              : [
                  [0, cellW - 1],
                  [cellW, cellW * 2 - 1],
                  [cellW * 2, cellW * 3 - 1],
                  [cellW * 3, w - 1],
                ];
        }

        finalSpans.forEach(([x0, x1], idx) => {
          let minX = x1, maxX = x0, minY = row.y1 - 1, maxY = row.y0;
          for (let y = row.y0; y < row.y1; y++) {
            for (let x = x0; x <= x1; x++) {
              if (d[(y * w + x) * 4 + 3] > 24) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX <= minX || maxY <= minY) return;
          const tw = maxX - minX + 1;
          const th = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = tw;
          out.height = th;
          out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
          this.images[row.names[idx]] = out;
        });
      }

      // Default alias for fallback references
      if (this.images["raven_idle"]) {
        this.images["hero_raven_normal"] = this.images["raven_idle"];
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Extract Raven (暗影會・暗殺者) sprites, portrait & custom skill buttons directly from her character sheet!
  loadRavenSheet(src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const extractCutout = (rx, ry, rw, rh) => {
        const cw = Math.max(1, Math.floor(w * rw));
        const ch = Math.max(1, Math.floor(h * rh));
        const sx = Math.floor(w * rx);
        const sy = Math.floor(h * ry);
        const off = document.createElement("canvas");
        off.width = cw;
        off.height = ch;
        const octx = off.getContext("2d", { willReadFrequently: true });
        octx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
        const id = octx.getImageData(0, 0, cw, ch);
        const d = id.data;

        const bgR = d[0], bgG = d[1], bgB = d[2];
        const isBg = (idx) => {
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 42;
        };

        const visited = new Uint8Array(cw * ch);
        const q = new Int32Array(cw * ch);
        let qh = 0, qt = 0;
        const enq = (x, y) => {
          if (x < 0 || y < 0 || x >= cw || y >= ch) return;
          const p = y * cw + x;
          if (visited[p]) return;
          if (isBg(p * 4)) {
            visited[p] = 1;
            d[p * 4 + 3] = 0;
            q[qt++] = p;
          }
        };
        for (let x = 0; x < cw; x++) { enq(x, 0); enq(x, ch - 1); }
        for (let y = 0; y < ch; y++) { enq(0, y); enq(cw - 1, y); }
        while (qh < qt) {
          const p = q[qh++];
          const x = p % cw, y = (p - x) / cw;
          enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
        }

        // Clean enclosed dark-teal gaps between legs/skirt
        for (let p = 0; p < cw * ch; p++) {
          if (!visited[p]) {
            const idx = p * 4;
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            if (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 22) {
              d[idx + 3] = 0;
            }
          }
        }
        octx.putImageData(id, 0, 0);

        // Tight auto-crop
        let minX = cw, maxX = 0, minY = ch, maxY = 0;
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            if (d[(y * cw + x) * 4 + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX <= minX || maxY <= minY) return off;
        const tw = maxX - minX + 1;
        const th = maxY - minY + 1;
        const out = document.createElement("canvas");
        out.width = tw;
        out.height = th;
        out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
        return out;
      };

      // Right-facing 3/4 combat sprite & Front pose sprite
      this.images["hero_raven_normal"] = extractCutout(0.34, 0.008, 0.135, 0.568);
      this.images["hero_raven_front"] = extractCutout(0.145, 0.008, 0.165, 0.568);

      // Top-right close-up portrait for HUD headshot
      const pCanvas = document.createElement("canvas");
      pCanvas.width = 128;
      pCanvas.height = 128;
      pCanvas.getContext("2d").drawImage(img, w * 0.855, h * 0.012, w * 0.132, h * 0.185, 0, 0, 128, 128);
      this.images["hero_raven_portrait"] = pCanvas;

      // Pixelated custom circular touch buttons (ult=portrait/eclipse, jump=grapple, atk=dagger/knives)
      const btnSpecs = [
        { id: "ult", rx: 0.855, ry: 0.012, rw: 0.132, rh: 0.185 },
        { id: "jump", rx: 0.675, ry: 0.79, rw: 0.115, rh: 0.145 },
        { id: "atk", rx: 0.255, ry: 0.79, rw: 0.115, rh: 0.145 },
      ];
      for (const s of btnSpecs) {
        const pSize = 52;
        const small = document.createElement("canvas");
        small.width = pSize;
        small.height = pSize;
        const sctx = small.getContext("2d", { willReadFrequently: true });
        sctx.fillStyle = "#090d16";
        sctx.fillRect(0, 0, pSize, pSize);
        sctx.drawImage(img, w * s.rx, h * s.ry, w * s.rw, h * s.rh, 0, 0, pSize, pSize);
        const idata = sctx.getImageData(0, 0, pSize, pSize);
        const bd = idata.data;
        const cx = pSize / 2, cy = pSize / 2, maxR = pSize * 0.49;
        for (let y = 0; y < pSize; y++) {
          for (let x = 0; x < pSize; x++) {
            const idx = (y * pSize + x) * 4;
            if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
              bd[idx + 3] = 0;
              continue;
            }
            bd[idx] = Math.min(255, Math.round(bd[idx] / 16) * 16);
            bd[idx + 1] = Math.min(255, Math.round(bd[idx + 1] / 16) * 16);
            bd[idx + 2] = Math.min(255, Math.round(bd[idx + 2] / 16) * 16);
          }
        }
        sctx.putImageData(idata, 0, 0);
        const out = document.createElement("canvas");
        out.width = pSize * 3;
        out.height = pSize * 3;
        const octx = out.getContext("2d");
        octx.imageSmoothingEnabled = false;
        octx.drawImage(small, 0, 0, out.width, out.height);
        document.documentElement.style.setProperty(`--raven-btn-${s.id}`, `url(${out.toDataURL("image/png")})`);
      }

      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }



  // Slice & chroma-key the 3-frame Dual-Katana Samurai sheet (Idle, Forward Dash, X-Cross Slash!)
  loadDualSamuraiSheet(src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, w, h);
      const d = id.data;

      // Sample solid dark-teal background color from top-left corner
      const bgR = d[0], bgG = d[1], bgB = d[2];
      const isBg = (idx) => {
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 42;
      };

      // BFS flood-fill from borders to remove dark-teal background cleanly
      const visited = new Uint8Array(w * h);
      const removed = new Uint8Array(w * h);
      const q = new Int32Array(w * h);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        if (isBg(p * 4)) {
          visited[p] = 1;
          removed[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < w; x++) { enq(x, 0); enq(x, h - 1); }
      for (let y = 0; y < h; y++) { enq(0, y); enq(w - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % w, y = (p - x) / w;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }

      // Remove enclosed interior teal gaps (between legs / arms / blades)
      for (let p = 0; p < w * h; p++) {
        if (!removed[p]) {
          const idx = p * 4;
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          if (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 28) {
            d[idx + 3] = 0;
            removed[p] = 1;
          }
        }
      }
      octx.putImageData(id, 0, 0);

      // Auto-detect the 3 horizontal sprite segments so zero blade tips get clipped!
      const colHasPx = new Uint8Array(w);
      for (let x = 0; x < w; x++) {
        let count = 0;
        for (let y = 0; y < h; y++) {
          if (d[(y * w + x) * 4 + 3] > 20) count++;
        }
        if (count >= 4) colHasPx[x] = 1;
      }

      const spans = [];
      let inSpan = false, sStart = 0;
      for (let x = 0; x < w; x++) {
        if (colHasPx[x] && !inSpan) {
          inSpan = true;
          sStart = x;
        } else if (!colHasPx[x] && inSpan) {
          inSpan = false;
          if (x - sStart > 30) spans.push([sStart, x - 1]);
        }
      }
      if (inSpan && w - sStart > 30) spans.push([sStart, w - 1]);

      // Fallback splits if spans weren't cleanly separated
      const finalSpans =
        spans.length >= 3
          ? [spans[0], spans[1], spans[spans.length - 1]]
          : [
              [0, Math.floor(w * 0.21)],
              [Math.floor(w * 0.21), Math.floor(w * 0.52)],
              [Math.floor(w * 0.52), w - 1],
            ];

      const names = ["samurai_dual_idle", "samurai_dual_dash", "samurai_dual_cross"];
      finalSpans.forEach(([x0, x1], i) => {
        let minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = x0; x <= x1; x++) {
            if (d[(y * w + x) * 4 + 3] > 20) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        const cw = x1 - x0 + 1;
        const ch = Math.max(1, maxY - minY + 1);
        const c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        c.getContext("2d").drawImage(off, x0, minY, cw, ch, 0, 0, cw, ch);
        this.images[names[i]] = c;
      });
      this.readyCount++;
    };
    img.src = src;
  }

  loadRaw(name, src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      this.images[name] = img;
      this.readyCount++;
    };
    img.src = src;
  }

  ensureRaw(name, src) {
    if (!this._loadingKeys) this._loadingKeys = new Set();
    if (this.images[name] || this._loadingKeys.has(name)) return;
    this._loadingKeys.add(name);
    const img = new Image();
    img.onload = () => {
      this.images[name] = img;
    };
    img.src = src;
  }

  // Build a 3-Tier Tall Scrollable World Map (1376x2200):
  // Row 1 (0..768)    = Island 1 (Left) + Bio-Island (Right)
  // Row 2 (768..1480) = Taiwan Island (Left) + Pixel-Art Japan Archipelago (Right)
  // Row 3 (1480..2200)= Pixel-Art Southeast Asia 4-Country Archipelago (Thailand, Vietnam, Malaysia, Singapore)!
  loadTallScrollableWorldMap(topSrc, taiwanSrc, japanSrc, seaSrc) {
    this.totalCount++;
    const topImg = new Image();
    const twImg = new Image();
    const jpImg = new Image();
    const seaImg = new Image();
    let loaded = 0;

    const onAllLoaded = () => {
      loaded++;
      if (loaded < 4) return;

      const W = 1376;
      const topH = 768;
      const H = 2200;

      // Sample exact bottom-edge ocean color of topImg for a 100% invisible transition!
      const tmp = document.createElement("canvas");
      tmp.width = topImg.width;
      tmp.height = topImg.height;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      tctx.drawImage(topImg, 0, 0);
      const sample = tctx.getImageData(Math.floor(topImg.width * 0.5), topImg.height - 6, 1, 1).data;
      const ocR = sample[0], ocG = sample[1], ocB = sample[2];

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");

      // 1. Seamless ocean base for full tall map
      ctx.fillStyle = `rgb(${ocR}, ${ocG}, ${ocB})`;
      ctx.fillRect(0, 0, W, H);

      // 2. Top half: 100% untouched original 2-island World Map!
      ctx.drawImage(topImg, 0, 0, W, topH);

      // Scatter matching pixel wave crests across the southern oceans below y = 768
      ctx.fillStyle = "rgba(186, 230, 253, 0.58)";
      for (let i = 0; i < 165; i++) {
        const wx = ((i * 211 + 37) % (W - 40)) + 20;
        const wy = topH + 18 + ((i * 97 + 29) % (H - topH - 40));
        ctx.fillRect(wx, wy, 10, 3);
        ctx.fillRect(wx + 12, wy + 2, 6, 3);
      }

      // 3. Extract ONLY Taiwan Island cleanly via BFS ocean removal (zero Island-1 corner!)
      const sx = 548, sy = 404, sw = 224, sh = 356;
      const buf = document.createElement("canvas");
      buf.width = sw;
      buf.height = sh;
      const bctx = buf.getContext("2d", { willReadFrequently: true });
      bctx.drawImage(twImg, sx, sy, sw, sh, 0, 0, sw, sh);
      const id = bctx.getImageData(0, 0, sw, sh);
      const d = id.data;

      // Clear top-left triangle where Island 1's coast slightly overlapped the crop box
      for (let y = 0; y < 145; y++) {
        for (let x = 0; x < 105 - y * 0.7; x++) {
          d[(y * sw + Math.floor(x)) * 4 + 3] = 0;
        }
      }

      const isOcean = (idx) => {
        if (d[idx + 3] === 0) return true;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return Math.abs(r - ocR) + Math.abs(g - ocG) + Math.abs(b - ocB) < 68;
      };
      const visited = new Uint8Array(sw * sh);
      const q = new Int32Array(sw * sh);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= sw || y >= sh) return;
        const p = y * sw + x;
        if (visited[p]) return;
        if (isOcean(p * 4)) {
          visited[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < sw; x++) { enq(x, 0); enq(x, sh - 1); }
      for (let y = 0; y < sh; y++) { enq(0, y); enq(sw - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % sw, y = (p - x) / sw;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }
      bctx.putImageData(id, 0, 0);

      // Draw HUGE, CLEAN Taiwan Island right below Island 1 in the southern ocean!
      ctx.save();
      ctx.translate(360, 1085);
      ctx.drawImage(buf, -185, -280, 370, 560);
      ctx.restore();

      // 4. Composite high-detail 32-bit SNES Pixel-Art Japan Archipelago (BFS ocean removal preserves turquoise shallows & surf foam!)
      const jw = jpImg.width;
      const jh = jpImg.height;
      const jbuf = document.createElement("canvas");
      jbuf.width = jw;
      jbuf.height = jh;
      const jctx = jbuf.getContext("2d", { willReadFrequently: true });
      jctx.drawImage(jpImg, 0, 0);
      const jid = jctx.getImageData(0, 0, jw, jh);
      const jd = jid.data;
      const jOcR = jd[4 * 4], jOcG = jd[4 * 4 + 1], jOcB = jd[4 * 4 + 2];
      const isJpOcean = (idx) => {
        if (jd[idx + 3] === 0) return true;
        const r = jd[idx], g = jd[idx + 1], b = jd[idx + 2];
        return Math.abs(r - jOcR) + Math.abs(g - jOcG) + Math.abs(b - jOcB) < 54;
      };
      const jvis = new Uint8Array(jw * jh);
      const jq = new Int32Array(jw * jh);
      let jqh = 0, jqt = 0;
      const jenq = (x, y) => {
        if (x < 0 || y < 0 || x >= jw || y >= jh) return;
        const p = y * jw + x;
        if (jvis[p]) return;
        if (isJpOcean(p * 4)) {
          jvis[p] = 1;
          jd[p * 4 + 3] = 0;
          jq[jqt++] = p;
        }
      };
      for (let x = 0; x < jw; x++) { jenq(x, 0); jenq(x, jh - 1); }
      for (let y = 0; y < jh; y++) { jenq(0, y); jenq(jw - 1, y); }
      while (jqh < jqt) {
        const p = jq[jqh++];
        const x = p % jw, y = (p - x) / jw;
        jenq(x + 1, y); jenq(x - 1, y); jenq(x, y + 1); jenq(x, y - 1);
      }
      jctx.putImageData(jid, 0, 0);

      ctx.save();
      ctx.translate(1015, 1085);
      ctx.drawImage(jbuf, -320, -320, 640, 640);
      ctx.restore();

      // 5. Composite high-detail 32-bit SNES Pixel-Art Southeast Asia 4-Country Archipelago in Row 3 (y = 1480..2200)!
      const sw3 = seaImg.width;
      const sh3 = seaImg.height;
      const sbuf = document.createElement("canvas");
      sbuf.width = sw3;
      sbuf.height = sh3;
      const sctx = sbuf.getContext("2d", { willReadFrequently: true });
      sctx.drawImage(seaImg, 0, 0);
      const sid = sctx.getImageData(0, 0, sw3, sh3);
      const sd = sid.data;
      const sOcR = sd[4 * 4], sOcG = sd[4 * 4 + 1], sOcB = sd[4 * 4 + 2];
      const isSeaOcean = (idx) => {
        if (sd[idx + 3] === 0) return true;
        const r = sd[idx], g = sd[idx + 1], b = sd[idx + 2];
        return Math.abs(r - sOcR) + Math.abs(g - sOcG) + Math.abs(b - sOcB) < 54;
      };
      const svis = new Uint8Array(sw3 * sh3);
      const sq = new Int32Array(sw3 * sh3);
      let sqh = 0, sqt = 0;
      const senq = (x, y) => {
        if (x < 0 || y < 0 || x >= sw3 || y >= sh3) return;
        const p = y * sw3 + x;
        if (svis[p]) return;
        if (isSeaOcean(p * 4)) {
          svis[p] = 1;
          sd[p * 4 + 3] = 0;
          sq[sqt++] = p;
        }
      };
      for (let x = 0; x < sw3; x++) { senq(x, 0); senq(x, sh3 - 1); }
      for (let y = 0; y < sh3; y++) { senq(0, y); senq(sw3 - 1, y); }
      while (sqh < sqt) {
        const p = sq[sqh++];
        const x = p % sw3, y = (p - x) / sw3;
        senq(x + 1, y); senq(x - 1, y); senq(x, y + 1); senq(x, y - 1);
      }
      sctx.putImageData(sid, 0, 0);

      ctx.save();
      ctx.translate(688, 1835);
      ctx.drawImage(sbuf, -620, -348, 1240, 696);
      ctx.restore();

      this.images["map_island"] = out;
      this.readyCount++;
    };

    topImg.onload = onAllLoaded;
    twImg.onload = onAllLoaded;
    jpImg.onload = onAllLoaded;
    seaImg.onload = onAllLoaded;
    topImg.src = topSrc;
    twImg.src = taiwanSrc;
    jpImg.src = japanSrc;
    seaImg.src = seaSrc;
  }

  loadSprite(name, src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      this.images[name] = this.processChromaKey(img);
      this.readyCount++;
    };
    img.src = src;
  }

  // Helper: Render a 52x52 native 32-bit pixelated circular button icon & export crisp 3x DataURL
  makePixelButtonIcon(drawFn) {
    const pSize = 52;
    const small = document.createElement("canvas");
    small.width = pSize;
    small.height = pSize;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    sctx.imageSmoothingEnabled = false;
    drawFn(sctx, pSize);

    // Circular mask + crisp 32-bit color quantization
    const idata = sctx.getImageData(0, 0, pSize, pSize);
    const d = idata.data;
    const cx = pSize / 2;
    const cy = pSize / 2;
    const maxR = pSize * 0.49;
    for (let y = 0; y < pSize; y++) {
      for (let x = 0; x < pSize; x++) {
        const idx = (y * pSize + x) * 4;
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
          d[idx + 3] = 0;
          continue;
        }
        d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
        d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
        d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
      }
    }
    sctx.putImageData(idata, 0, 0);

    const out = document.createElement("canvas");
    out.width = pSize * 3;
    out.height = pSize * 3;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = false;
    octx.drawImage(small, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  }

  drawJumpArrows(ctx, pSize) {
    // Deep electric blue speed background + two bright cyan upward arrows (matches Momo's Jump style!)
    const bg = ctx.createLinearGradient(0, pSize, pSize, 0);
    bg.addColorStop(0, "#041226");
    bg.addColorStop(0.55, "#0b3a66");
    bg.addColorStop(1, "#0284c7");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, pSize, pSize);

    // Glowing diagonal speed lines
    ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 46); ctx.lineTo(26, 22);
    ctx.moveTo(18, 48); ctx.lineTo(44, 16);
    ctx.stroke();

    // Two crisp upward arrows on right side
    const drawArrow = (x, y, s) => {
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x + s * 0.42, y + s);
      ctx.lineTo(x + s * 0.42, y + s * 2.5);
      ctx.lineTo(x - s * 0.42, y + s * 2.5);
      ctx.lineTo(x - s * 0.42, y + s);
      ctx.lineTo(x - s, y + s);
      ctx.closePath();
      ctx.fill();
    };
    drawArrow(38, 12, 6);
    drawArrow(43, 24, 5);
  }

  tryBuildMustacheButtons() {
    const norm = this.images["hero_mustache_normal"];
    const buff = this.images["hero_mustache_buff"];
    if (!norm || !buff) return;

    // 1. MUSTACHE ULT: Gold Lightning Aura + Buff Mustache Close-Up!
    const ultUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#f59e0b");
      bg.addColorStop(0.6, "#78350f");
      bg.addColorStop(1, "#1c1917");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Electric blue-gold lightning bolts behind hero
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(6, 12); c.lineTo(16, 20); c.lineTo(10, 28); c.lineTo(20, 38);
      c.moveTo(46, 10); c.lineTo(36, 20); c.lineTo(42, 28); c.lineTo(32, 38);
      c.stroke();
      // Buff hero upper body & mustache portrait
      const cropH = buff.height * 0.62;
      const cropW = Math.min(buff.width, cropH * 1.05);
      const cropX = (buff.width - cropW) / 2;
      c.drawImage(buff, cropX, 0, cropW, cropH, 5, 4, 42, 44);
    });

    // 2. MUSTACHE JUMP: Cyan Speed Arrows + Leaping Mustache Hero!
    const jumpUrl = this.makePixelButtonIcon((c, s) => {
      this.drawJumpArrows(c, s);
      c.save();
      c.translate(22, 27);
      c.rotate(-0.18);
      const th = 38;
      const tw = (norm.width / norm.height) * th;
      c.drawImage(norm, -tw / 2, -th / 2, tw, th);
      c.restore();
    });

    // 3. MUSTACHE ATTACK: Crimson/Gold Impact Burst + Armored Power Punch!
    const atkUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(34, 24, 3, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#fef08a");
      bg.addColorStop(0.35, "#dc2626");
      bg.addColorStop(1, "#2a0808");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Impact shockwave rings
      c.strokeStyle = "#fde047";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(35, 24, 12, 0, Math.PI * 2);
      c.stroke();
      // Hero punching silhouette + glowing golden fist
      const cropH = buff.height * 0.68;
      c.drawImage(buff, 0, buff.height * 0.08, buff.width, cropH, 2, 7, 44, 40);
      // Extra glowing punch flare
      c.fillStyle = "rgba(254, 240, 138, 0.85)";
      c.fillRect(34, 20, 8, 8);
      c.fillStyle = "#ffffff";
      c.fillRect(36, 22, 4, 4);
    });

    document.documentElement.style.setProperty("--mustache-btn-ult", `url(${ultUrl})`);
    document.documentElement.style.setProperty("--mustache-btn-jump", `url(${jumpUrl})`);
    document.documentElement.style.setProperty("--mustache-btn-atk", `url(${atkUrl})`);
  }

  tryBuildSamuraiButtons() {
    const idle = this.images["hero_samurai_idle"];
    const slash = this.images["hero_samurai_slash"];
    if (!idle || !slash) return;

    // 1. SAMURAI ULT: Swirling Cyan/Gold Sword-Qi Vortex + Street Samurai Portrait!
    const ultUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#0ea5e9");
      bg.addColorStop(0.55, "#1e1b4b");
      bg.addColorStop(1, "#090d16");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Swirling sword-qi crescent arcs
      c.strokeStyle = "#fde047";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s / 2, s / 2, 20, -2.5, -0.4);
      c.stroke();
      c.strokeStyle = "#38bdf8";
      c.beginPath();
      c.arc(s / 2, s / 2, 18, 0.5, 2.6);
      c.stroke();
      // Samurai close-up headshot (curly hair + black glasses)
      const cropH = idle.height * 0.56;
      const cropW = Math.min(idle.width, cropH * 1.05);
      const cropX = (idle.width - cropW) / 2;
      c.drawImage(idle, cropX, 0, cropW, cropH, 5, 5, 42, 43);
    });

    // 2. SAMURAI JUMP: Cyan Speed Arrows + Leaping Street Samurai!
    const jumpUrl = this.makePixelButtonIcon((c, s) => {
      this.drawJumpArrows(c, s);
      c.save();
      c.translate(22, 27);
      c.rotate(-0.18);
      const th = 38;
      const tw = (idle.width / idle.height) * th;
      c.drawImage(idle, -tw / 2, -th / 2, tw, th);
      c.restore();
    });

    // 3. SAMURAI ATTACK: Crimson Slash Backdrop + Katana Horizontal Slash!
    const atkUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(34, 24, 3, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#fb7185");
      bg.addColorStop(0.45, "#881337");
      bg.addColorStop(1, "#18050d");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Samurai slashing sprite
      const th = 42;
      const tw = (slash.width / slash.height) * th;
      c.drawImage(slash, 24 - tw * 0.5, 6, tw, th);
      // Blazing white-cyan katana crescent slash arc across button!
      c.strokeStyle = "#fda4af";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(24, 26, 20, -1.0, 0.85);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(25, 26, 19, -0.9, 0.75);
      c.stroke();
    });

    document.documentElement.style.setProperty("--samurai-btn-ult", `url(${ultUrl})`);
    document.documentElement.style.setProperty("--samurai-btn-jump", `url(${jumpUrl})`);
    document.documentElement.style.setProperty("--samurai-btn-atk", `url(${atkUrl})`);
  }

  // BFS Flood-Fill Magenta (#FF00FF) removal + Edge Despill + Tight Auto-Crop
  processChromaKey(img) {
    const maxDim = 320;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0, w, h);

    const imgData = octx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Sample corner color as reference background
    const bgR = d[0], bgG = d[1], bgB = d[2];

    const isMagentaBg = (idx) => {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      // Strong magenta chroma-key check OR close to sampled corner color
      const magentaScore = (r - g) + (b - g);
      if (r > 120 && b > 120 && g < 135 && magentaScore > 95) return true;
      const distCorner = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      return distCorner < 72 && r > g + 30 && b > g + 30;
    };

    const visited = new Uint8Array(w * h);
    const removed = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let qHead = 0;
    let qTail = 0;

    const tryEnqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (visited[p]) return;
      if (isMagentaBg(p * 4)) {
        visited[p] = 1;
        removed[p] = 1;
        queue[qTail++] = p;
      }
    };

    // Seed flood-fill from all 4 edges
    for (let x = 0; x < w; x++) {
      tryEnqueue(x, 0);
      tryEnqueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      tryEnqueue(0, y);
      tryEnqueue(w - 1, y);
    }

    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % w;
      const y = (p - x) / w;
      tryEnqueue(x + 1, y);
      tryEnqueue(x - 1, y);
      tryEnqueue(x, y + 1);
      tryEnqueue(x, y - 1);
    }

    // Also remove any enclosed interior magenta pockets (e.g. between legs/arms)
    for (let p = 0; p < w * h; p++) {
      if (!removed[p]) {
        const idx = p * 4;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        if (r > 180 && b > 180 && g < 85 && (r - g) > 110 && (b - g) > 110) {
          removed[p] = 1;
        }
      }
    }

    // Apply alpha removal + 1px edge despill to eliminate any pink fringe
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const idx = p * 4;
        if (removed[p]) {
          d[idx + 3] = 0;
        } else {
          // Check if adjacent to removed pixel
          const nearBg =
            (x > 0 && removed[p - 1]) ||
            (x < w - 1 && removed[p + 1]) ||
            (y > 0 && removed[p - w]) ||
            (y < h - 1 && removed[p + w]);
          if (nearBg) {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            if (r > g + 22 && b > g + 22) {
              // Soften & neutralize magenta fringe
              const excess = Math.min(r - g, b - g);
              if (excess > 55) {
                d[idx + 3] = 0;
                continue;
              }
              d[idx] = Math.max(0, r - excess);
              d[idx + 2] = Math.max(0, b - excess);
              d[idx + 3] = 210;
            }
          }
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    octx.putImageData(imgData, 0, 0);

    // Tight crop to opaque bounding box
    if (maxX <= minX || maxY <= minY) return off;
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const cropped = document.createElement("canvas");
    cropped.width = cw;
    cropped.height = ch;
    cropped.getContext("2d").drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch);
    return cropped;
  }
}

window.sprites = new SpriteBank();
