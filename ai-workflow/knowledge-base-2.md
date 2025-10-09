# Knowledge Base File 2

<!--
INSTRUCTIONS:
Paste your second knowledge base file content here.
This file will be loaded and referenced by the AI system during the workflow.

Use this for:
- Additional reference materials
- Supplementary frameworks
- Advanced techniques
- Domain expertise
- Success patterns

The AI will use this knowledge to provide more informed and accurate guidance.
-->

---

**PASTE YOUR KNOWLEDGE BASE CONTENT BELOW:**

{
  "meta": {
    "name": "ai_api_keys_and_model_landscape",
    "version": "1.0.0",
    "purpose": "consolidate_ai_model_and_media_api_options_pricing_context_and_selection_rules_for_saas_builders",
    "created": "2025-10-09T00:00:00Z",
    "chapters_map": {
      "purpose_scope": "section_1",
      "anthropic_claude_series": "section_2",
      "openai_gpt_family": "section_3",
      "perplexity_sonar_models": "section_4",
      "xai_grok_family": "section_5",
      "meta_llama_family": "section_6",
      "google_gemini_family": "section_7",
      "cohere_command_aya": "section_8",
      "mistral_family": "section_9",
      "generative_media_apis": "section_10",
      "decision_tips": "section_11"
    }
  },
  "feature_flags": {
    "include_examples": true,
    "include_pitfalls": true,
    "include_checklists": true,
    "include_templates": true,
    "include_rationales": true,
    "compression_level": "middle_ground"
  },
  "term_map": [
    {
      "original": "context window",
      "plain": "max_context_tokens",
      "definition": "maximum_number_of_tokens_model_can_consider_in_a_single_request_roundtrip",
      "_refs": ["doc:guide_ai_api_keys/llm_pricing_tables"]
    },
    {
      "original": "tokens",
      "plain": "tokens",
      "definition": "subword_units_used_for_billing_and_context_limits",
      "_refs": ["doc:guide_ai_api_keys/llm_pricing_tables"]
    },
    {
      "original": "multimodal",
      "plain": "multi_input_output",
      "definition": "model_accepts_or_emits_multiple_modalities_text_image_audio_video",
      "_refs": ["doc:guide_ai_api_keys/model_overviews"]
    },
    {
      "original": "RAG (retrieval-augmented generation)",
      "plain": "retrieval_augmented_generation",
      "definition": "approach_that_queries_external_knowledge_sources_and_feeds_results_to_the_model",
      "_refs": ["doc:guide_ai_api_keys/perplexity_overview"]
    },
    {
      "original": "RPM / RPS",
      "plain": "rate_limits",
      "definition": "requests_or_tokens_allowed_per_minute_or_per_second",
      "_refs": ["doc:guide_ai_api_keys/xai_grok_table"]
    },
    {
      "original": "pricing per million tokens",
      "plain": "price_per_million_tokens",
      "definition": "billing_unit_for_input_and_output_tokens_expressed_per_1_000_000_tokens",
      "_refs": ["doc:guide_ai_api_keys/llm_pricing_tables"]
    }
  ],
  "sections": {
    "purpose_scope": {
      "principles": [
        "summarize_leading_llm_and_media_apis",
        "capture_pricing_context_windows_modalities_and_best_uses",
        "target_founders_and_technical_teams_needing_model_selection_guidance"
      ],
      "examples_min": [
        {
          "input": "team_needs_low_cost_chat",
          "output": "consider_small_or_mini_variants_e_g_gpt_5_nano_llama_3_2_3b_command_light"
        },
        {
          "input": "team_needs_long_context_research",
          "output": "consider_gpt_4_1_llama_4_scout_or_opus_tiers_with_200k_plus_context"
        }
      ],
      "pitfalls_min": [
        {"pitfall": "choosing_on_brand_not_requirements", "fix": "match_model_to_task_budget_and_context"},
        {"pitfall": "ignoring_extra_fees", "fix": "account_for_caching_storage_or_search_charges"}
      ],
      "checklist": [
        "use_case_defined",
        "context_window_needed_estimated",
        "multimodal_requirement_known",
        "budget_constraints_set"
      ],
      "templates": {
        "selection_matrix_note": "columns: task | required_context | latency_tolerance | modality | budget | candidate_models"
      },
      "_refs": ["doc:guide_ai_api_keys/purpose_scope"]
    },

    "anthropic_claude_series": {
      "principles": [
        "claude_excels_at_long_context_and_safety",
        "tiers_trade_off_cost_speed_and_reasoning",
        "opus_and_latest_sonnet_handle_complex_reasoning_and_agentic_work"
      ],
      "models": [
        {"name": "claude_3_haiku", "context_tokens": 200000, "price_per_million_tokens": {"input": 0.25, "output": 1.25}, "ideal_use": ["lightweight_chat", "moderation", "basic_summarisation"]},
        {"name": "claude_3_5_haiku", "context_tokens": 200000, "price_per_million_tokens": {"input": 0.80, "output": 4.00}, "ideal_use": ["richer_summaries", "moderate_analysis"]},
        {"name": "claude_3_sonnet", "context_tokens": 200000, "price_per_million_tokens": {"input": 3.0, "output": 15.0}, "ideal_use": ["enterprise_chat", "content_generation"]},
        {"name": "claude_3_5_sonnet", "context_tokens": 200000, "price_per_million_tokens": {"input": 3.0, "output": 15.0}, "ideal_use": ["coding", "planning", "complex_analysis"]},
        {"name": "claude_3_opus", "context_tokens": 200000, "price_per_million_tokens": {"input": 15.0, "output": 75.0}, "ideal_use": ["high_stakes_research", "complex_coding"]},
        {"name": "claude_sonnet_4", "context_tokens": 200000, "price_per_million_tokens": {"input": 3.0, "output": 15.0}, "notes": "pricing_doubles_beyond_200k_tokens"},
        {"name": "claude_opus_4_or_4_1", "context_tokens": 200000, "price_per_million_tokens": {"input": 15.0, "output": 75.0}, "ideal_use": ["deep_research", "agentic_tasks"]}
      ],
      "examples_min": [
        {"input": "200k_document_review_with_risk_analysis", "output": "claude_sonnet_4_or_opus_4_1"}
      ],
      "pitfalls_min": [
        {"pitfall": "using_opus_for_simple_tasks", "fix": "select_haiku_or_sonnet_for_cost_efficiency"}
      ],
      "checklist": ["long_context_required", "safety_priority_high", "budget_allows_premium_tiers"],
      "_refs": ["doc:guide_ai_api_keys/anthropic_tables"]
    },

    "openai_gpt_family": {
      "principles": [
        "broad_ecosystem_and_multimodal_support",
        "multiple_tiers_balance_cost_context_and_speed",
        "image_audio_and_realtime_endpoints_available"
      ],
      "models": [
        {"name": "gpt_4o", "context_tokens": 128000, "price_per_million_tokens": {"input": 2.5, "cached": 1.25, "output": 10.0}, "modalities": ["text","image","audio"], "ideal_use": ["flagship_assistant","agents","medium_docs"]},
        {"name": "gpt_4_1", "context_tokens": 1000000, "price_per_million_tokens": {"input": 2.0, "cached": 0.5, "output": 8.0}, "ideal_use": ["long_form_summaries","technical_analysis"]},
        {"name": "gpt_5", "context_tokens": 400000, "price_per_million_tokens": {"input": 1.25, "cached": 0.13, "output": 10.0}, "ideal_use": ["enterprise_reasoning","coding"]},
        {"name": "gpt_5_mini", "context_tokens": 400000, "price_per_million_tokens": {"input": 0.25, "output": 2.0}},
        {"name": "gpt_5_nano", "context_tokens": 400000, "price_per_million_tokens": {"input": 0.05, "output": 0.40}},
        {"name": "gpt_image_1", "price_per_million_tokens": {"input": 5.0, "output": 40.0}, "per_image_range_usd": [0.01, 0.17]},
        {"name": "whisper", "pricing_misc": {"usd_per_minute": 0.006}},
        {"name": "realtime_api_audio", "price_per_million_tokens": {"input": 100.0, "output": 200.0}},
        {"name": "tts", "pricing_misc": {"usd_per_million_tokens_standard": 15.0, "usd_per_million_tokens_hd": 30.0}}
      ],
      "examples_min": [
        {"input": "batch_document_summaries_under_budget", "output": "gpt_5_mini_or_nano"},
        {"input": "multimodal_voice_agent", "output": "gpt_4o_or_realtime_api_audio_plus_tts"}
      ],
      "pitfalls_min": [
        {"pitfall": "ignoring_knowledge_cutoffs", "fix": "add_browsing_or_retrieval_layer"},
        {"pitfall": "overpaying_for_simple_chat", "fix": "use_mini_nano_or_small_open_weights"}
      ],
      "checklist": ["context_needs_measured", "multimodal_required", "latency_and_cost_targets_defined"],
      "_refs": ["doc:guide_ai_api_keys/openai_tables"]
    },

    "perplexity_sonar_models": {
      "principles": [
        "search_grounded_answers_with_citations",
        "token_plus_query_fees_affect_total_cost",
        "best_when_freshness_and_sources_are_required"
      ],
      "models": [
        {"name": "sonar", "price_per_million_tokens": {"input": 1.0, "output": 1.0}, "extra_fees": {"search_queries_per_1000_usd": 5.0}},
        {"name": "sonar_pro", "price_per_million_tokens": {"input": 3.0, "output": 15.0}, "extra_fees": {"search_queries_per_1000_usd": 5.0}},
        {"name": "sonar_reasoning", "price_per_million_tokens": {"input": 1.0, "output": 5.0}},
        {"name": "sonar_reasoning_pro", "price_per_million_tokens": {"input": 2.0, "output": 8.0}},
        {"name": "sonar_deep_research", "price_per_million_tokens": {"input": 2.0, "output": 8.0}, "extra_fees": {"citation_tokens_per_million_usd": 2.0, "reasoning_tokens_per_million_usd": 3.0, "search_queries_per_1000_usd": 5.0}}
      ],
      "examples_min": [
        {"input": "executive_brief_needs_live_citations", "output": "sonar_or_sonar_pro"}
      ],
      "pitfalls_min": [
        {"pitfall": "forgetting_search_fees", "fix": "estimate_query_volume_and_add_to_budget"}
      ],
      "checklist": ["citations_required", "freshness_priority_high", "query_budget_allocated"],
      "_refs": ["doc:guide_ai_api_keys/perplexity_table"]
    },

    "xai_grok_family": {
      "principles": [
        "mixture_of_experts_with_live_social_data",
        "high_rate_limits_for_enterprise",
        "privacy_tradeoffs_may_apply"
      ],
      "models": [
        {"name": "grok_4_0709", "context_tokens": 256000, "rate_limits": {"tokens_per_minute": 2000000, "rpm": 480}, "price_per_million_tokens": {"input": 3.0, "output": 15.0}},
        {"name": "grok_3", "context_tokens": 131000, "rate_limits": {"rpm": 600}, "price_per_million_tokens": {"input": 3.0, "output": 15.0}},
        {"name": "grok_3_mini", "context_tokens": 131000, "rate_limits": {"rpm": 480}, "price_per_million_tokens": {"input": 0.30, "output": 0.50}},
        {"name": "grok_3_fast", "context_tokens": 131000, "rate_limits": {"rpm": 600}, "price_per_million_tokens": {"input": 5.0, "output": 25.0}},
        {"name": "grok_3_mini_fast", "context_tokens": 131000, "rate_limits": {"rpm": 180}, "price_per_million_tokens": {"input": 0.60, "output": 4.0}},
        {"name": "grok_2_vision_1212", "context_tokens": 32000, "price_per_million_tokens": {"input": 2.0, "output": 10.0}, "modalities": ["vision"]},
        {"name": "grok_2_image_1212", "pricing_misc": {"usd_per_image": 0.07}}
      ],
      "examples_min": [
        {"input": "agent_needs_live_trend_analysis", "output": "grok_4_0709_or_grok_3_fast"}
      ],
      "pitfalls_min": [
        {"pitfall": "underestimating_privacy_requirements", "fix": "review_data_policies_and_opt_outs"}
      ],
      "checklist": ["live_social_signals_required", "rate_limits_sufficient", "privacy_impacts_accepted"],
      "_refs": ["doc:guide_ai_api_keys/xai_grok_table"]
    },

    "meta_llama_family": {
      "principles": [
        "open_source_flexibility_with_very_long_context_variants",
        "vision_variants_available",
        "great_for_self_hosting_and_cost_control"
      ],
      "variants": [
        {"name": "llama_2_7b_chat", "price_per_million_tokens": {"input": 0.05, "output": 0.25}},
        {"name": "llama_2_70b", "price_per_million_tokens": {"input": 0.73, "output": 0.84}},
        {"name": "llama_3_8b_instruct", "context_tokens": 400000, "price_per_million_tokens": {"input": 0.06, "output": 0.06}},
        {"name": "llama_3_70b_instruct", "price_per_million_tokens": {"input": 0.35, "output": 0.40}},
        {"name": "llama_3_1_405b", "price_per_million_tokens": {"input": 6.0, "output": 12.0}},
        {"name": "llama_4_scout", "context_tokens": 10000000, "price_per_million_tokens": {"input": 0.15, "output": 0.50}, "promos": {"input": 0.11, "output": 0.34}},
        {"name": "llama_4_maverick", "context_tokens": 1000000, "price_per_million_tokens": {"input": 0.22, "output": 0.85}},
        {"name": "llama_3_3_70b_instruct", "context_tokens": 131000, "price_per_million_tokens": {"input": 0.038, "output": 0.12}},
        {"name": "llama_3_2_11b_vision_instruct", "context_tokens": 30000, "price_per_million_tokens": {"input": 0.049, "output": 0.049}, "image_cost_per_1k": 0.079},
        {"name": "llama_3_2_3b_instruct", "context_tokens": 30000, "price_per_million_tokens": {"input": 0.003, "output": 0.006}}
      ],
      "examples_min": [
        {"input": "self_hosted_private_deployment", "output": "llama_3_or_4_variant_on_prem_or_cloud_nim"}
      ],
      "pitfalls_min": [
        {"pitfall": "ignoring_devops_overhead", "fix": "budget_for_infra_monitoring_and_updates"}
      ],
      "checklist": ["self_hosting_required", "context_window_targeted", "vision_needed_or_not"],
      "_refs": ["doc:guide_ai_api_keys/meta_llama_table"]
    },

    "google_gemini_family": {
      "principles": [
        "multimodal_across_text_image_audio_video",
        "flash_for_cost_savings_pro_for_complex_tasks",
        "additional_fees_for_caching_and_storage_may_apply"
      ],
      "variants": [
        {"name": "gemini_1_5_flash", "context_tokens": 128000, "price_per_million_tokens": {"input": 0.075, "output": 0.30}},
        {"name": "gemini_1_5_flash_8b", "price_per_million_tokens": {"input": 0.0375, "output": 0.15}},
        {"name": "gemini_1_5_pro", "context_tokens": 128000, "price_per_million_tokens": {"input": 1.25, "output": 5.0}},
        {"name": "gemini_2_5_flash", "context_tokens": 200000, "price_per_million_tokens": {"input": 0.30, "output": 2.50}},
        {"name": "gemini_2_5_flash_lite", "price_per_million_tokens": {"input": 0.10, "output": 0.40}},
        {"name": "gemini_2_5_pro", "context_tokens": 200000, "price_per_million_tokens": {"input": 1.25, "output": 10.0}, "notes": "higher_cost_beyond_200k"},
        {"name": "imagen_4", "pricing_misc": {"usd_per_image_fast": 0.02, "usd_per_image_standard": 0.04, "usd_per_image_ultra": 0.06}}
      ],
      "examples_min": [
        {"input": "workspace_docs_sheets_integration", "output": "gemini_1_5_or_2_5_pro"}
      ],
      "pitfalls_min": [
        {"pitfall": "missing_caching_storage_fees", "fix": "include_vertex_ai_cache_and_storage_in_costs"}
      ],
      "checklist": ["multimodal_needed", "google_cloud_ok", "caching_budgeted"],
      "_refs": ["doc:guide_ai_api_keys/gemini_table"]
    },

    "cohere_command_aya": {
      "principles": [
        "enterprise_structured_tasks_with_retrieval_and_function_calling",
        "aya_models_emphasize_multilingual_support",
        "pricing_varies_by_r_plus_generation"
      ],
      "variants": [
        {"name": "command", "price_per_million_tokens": {"input": 1.0, "output": 2.0}},
        {"name": "command_light", "price_per_million_tokens": {"input": 0.30, "output": 0.60}},
        {"name": "command_r", "price_per_million_tokens": {"input": 0.50, "output": 1.50}},
        {"name": "command_r_plus", "price_per_million_tokens": {"input": 2.50, "output": 10.0}},
        {"name": "aya_expanse", "price_per_million_tokens": {"input": 0.50, "output": 1.50}}
      ],
      "examples_min": [
        {"input": "structured_enterprise_chat_with_tools", "output": "command_r_or_r_plus"}
      ],
      "pitfalls_min": [
        {"pitfall": "overlooking_multilingual_needs", "fix": "select_aya_when_language_coverage_is_key"}
      ],
      "checklist": ["retrieval_needed", "function_calling_needed", "language_coverage_defined"],
      "_refs": ["doc:guide_ai_api_keys/cohere_table"]
    },

    "mistral_family": {
      "principles": [
        "strong_quality_at_low_cost",
        "open_weights_enable_self_hosting",
        "devstral_specializes_in_code"
      ],
      "variants": [
        {"name": "medium_3", "price_per_million_tokens": {"input": 0.40, "output": 2.0}},
        {"name": "small_3_1", "price_per_million_tokens": {"input": 0.10, "output": 0.30}},
        {"name": "devstral_small", "price_per_million_tokens": {"input": 0.10, "output": 0.30}}
      ],
      "examples_min": [
        {"input": "code_generation_tools", "output": "devstral_small_or_medium_3"}
      ],
      "pitfalls_min": [
        {"pitfall": "assuming_all_tiers_have_same_performance", "fix": "benchmark_on_your_tasks"}
      ],
      "checklist": ["self_hosting_option_considered", "cost_targets_set", "code_generation_required"],
      "_refs": ["doc:guide_ai_api_keys/mistral_notes"]
    },

    "generative_media_apis": {
      "principles": [
        "video_image_and_audio_models_have_separate_billing",
        "tool_choice_depends_on_quality_and_integration_channel",
        "some_apis_are_invite_only_or_region_limited"
      ],
      "tools": [
        {"name": "veo_3", "modality": "video", "pricing": {"usd_per_second": 0.75, "pro_monthly_usd": 249.99}, "best_for": ["ads","explainers"]},
        {"name": "sora", "modality": "video", "pricing": {"public": "not_available"}, "best_for": ["storyboards","product_animations"]},
        {"name": "pika_v2_1_2_2", "modality": "video", "pricing": {"free_credits_per_month": 80, "pro_credits_per_month": 6000}, "best_for": ["social_creatives","shot_editing"]},
        {"name": "kling_piapi", "modality": "video", "pricing": {"usd_per_video_range": [0.16, 1.12], "seat_usd_per_month": 10.0}, "best_for": ["try_on","ecommerce_banners"]},
        {"name": "imagen_3_4", "modality": "image", "pricing": {"usd_per_image_range": [0.03, 0.06]}, "best_for": ["branding","product_visuals"]},
        {"name": "gpt_image_1", "modality": "image", "pricing": {"price_per_million_tokens_input": 5.0, "price_per_million_tokens_output": 40.0, "usd_per_image_range": [0.01, 0.17]}, "best_for": ["text_fidelity_graphics"]},
        {"name": "stability_sd_3_5", "modality": "image", "pricing": {"ultra_usd_per_image": 0.08, "core_usd_per_image": 0.03}, "best_for": ["design_pipelines","customization"]},
        {"name": "deepai", "modality": "image_video", "pricing": {"usd_per_500_images": 5.0, "usd_per_video_range": [1.0, 5.0]}, "best_for": ["mvps","education"]}
      ],
      "examples_min": [
        {"input": "marketing_banner_with_exact_text", "output": "gpt_image_1"},
        {"input": "high_end_4k_ad_spot", "output": "veo_3"}
      ],
      "pitfalls_min": [
        {"pitfall": "confusing_video_and_image_pricing", "fix": "separate_budget_lines_per_modality"},
        {"pitfall": "ignoring_invite_only_status", "fix": "plan_alternatives_or_waitlist"}
      ],
      "checklist": ["modality_fixed", "quality_target_defined", "integration_channel_supported"],
      "_refs": ["doc:guide_ai_api_keys/generative_media_section"]
    },

    "decision_tips": {
      "principles": [
        "match_task_to_model_strengths",
        "estimate_context_requirements",
        "opt_for_low_cost_models_early_then_scale",
        "consider_moderation_and_safety_layers_where_needed"
      ],
      "rules": [
        {"when": "long_compliance_docs", "then": ["gpt_4_1","claude_opus_4_1"]},
        {"when": "cost_sensitive_marketing_copy", "then": ["gpt_5_mini","gpt_5_nano","command_light","llama_3_2_3b"]},
        {"when": "creative_visuals", "then": ["gpt_image_1","imagen_4"]},
        {"when": "voice_assistants_transcription", "then": ["whisper","realtime_api_audio","tts"]},
        {"when": "developer_coding_tools", "then": ["mistral_devstral","cohere_command_r"]},
        {"when": "regulated_or_private", "then": ["llama_self_hosted","mistral_self_hosted","claude_or_cohere_for_safety"]}
      ],
      "examples_min": [
        {"input": "faq_bot_with_citations", "output": "perplexity_sonar_plus_low_cost_llm"},
        {"input": "million_token_project_planning", "output": "gpt_4_1_or_llama_4_scout"}
      ],
      "pitfalls_min": [
        {"pitfall": "using_long_context_for_short_tasks", "fix": "choose_mini_nano_or_small_models"},
        {"pitfall": "missing_safety_moderation", "fix": "add_llama_guard_or_provider_safety_layers"}
      ],
      "checklist": [
        "task_aligned_to_model",
        "context_estimate_made",
        "budget_estimate_complete",
        "safety_and_moderation_included"
      ],
      "templates": {
        "provider_shortlist": "inputs: task, budget, context, modality -> outputs: top_3_models_with_tradeoffs",
        "tco_estimator": "inputs: tokens_in tokens_out images videos queries months -> outputs: monthly_cost_breakdown"
      ],
      "rationales": {
        "why_start_small": "reduces_cost_and_lock_in_before_validating_requirements",
        "why_long_context_choices": "avoids_fragmentation_when_documents_are_huge"
      },
      "_refs": ["doc:guide_ai_api_keys/decision_tips"]
    }
  }
}
