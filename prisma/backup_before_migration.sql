--
-- PostgreSQL database dump
--

\restrict Eht4VvXi16iNf9ttthtHb1viqoKNYAZfjBO93amQ06d2EtSjlYJbsQ2BhRLODlj

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CheckInStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CheckInStatus" AS ENUM (
    'COMPLETED',
    'KEPT',
    'LAPSED',
    'REST',
    'SKIPPED'
);


ALTER TYPE public."CheckInStatus" OWNER TO postgres;

--
-- Name: EnergyLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EnergyLevel" AS ENUM (
    'HIGH',
    'NORMAL',
    'LOW',
    'REST'
);


ALTER TYPE public."EnergyLevel" OWNER TO postgres;

--
-- Name: ItemStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ItemStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE public."ItemStatus" OWNER TO postgres;

--
-- Name: ItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ItemType" AS ENUM (
    'HABIT',
    'QUIT_HABIT',
    'TODO'
);


ALTER TYPE public."ItemType" OWNER TO postgres;

--
-- Name: Layer; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Layer" AS ENUM (
    'BODY',
    'CRAFT',
    'SIGNAL',
    'MEMORY',
    'JUDGMENT',
    'CONTEMPLATION',
    'LIFE'
);


ALTER TYPE public."Layer" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    color_code text,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: check_ins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.check_ins (
    id text NOT NULL,
    user_id text NOT NULL,
    item_id text NOT NULL,
    date text NOT NULL,
    status public."CheckInStatus" NOT NULL,
    planned_energy public."EnergyLevel",
    actual_energy public."EnergyLevel",
    action_text text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.check_ins OWNER TO postgres;

--
-- Name: daily_energy_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_energy_states (
    id text NOT NULL,
    user_id text NOT NULL,
    date text NOT NULL,
    energy_level public."EnergyLevel" NOT NULL,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.daily_energy_states OWNER TO postgres;

--
-- Name: energy_action_presets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_action_presets (
    id text NOT NULL,
    item_id text NOT NULL,
    energy_level public."EnergyLevel" NOT NULL,
    action_text text NOT NULL,
    description text
);


ALTER TABLE public.energy_action_presets OWNER TO postgres;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    why_prompt text,
    type public."ItemType" NOT NULL,
    layer public."Layer" DEFAULT 'LIFE'::public."Layer" NOT NULL,
    status public."ItemStatus" DEFAULT 'ACTIVE'::public."ItemStatus" NOT NULL,
    frequency_days text,
    target_per_week integer,
    due_date text,
    sort_order integer DEFAULT 0 NOT NULL,
    color_code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    archived_at timestamp(3) without time zone,
    custom_category text,
    category_id text
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    session_token text NOT NULL,
    user_id text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: tool_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tool_links (
    id text NOT NULL,
    item_id text NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    energy_level public."EnergyLevel",
    description text,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.tool_links OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text,
    email_verified timestamp(3) without time zone,
    image text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, user_id, name, color_code, icon, sort_order, created_at, updated_at) FROM stdin;
cmtc02zz000022wtf1xmqy437	cmtbz960o0000mido6ln0woqv	身体与健康	#10B981	\N	0	2026-08-27 20:53:51.901	2026-08-27 20:53:51.901
cmtc02zz600042wtffwgwtixx	cmtbz960o0000mido6ln0woqv	创造与工作	#F59E0B	\N	1	2026-08-27 20:53:51.906	2026-08-27 20:53:51.906
cmtc02zz700062wtf1qhmqr54	cmtbz960o0000mido6ln0woqv	学习与输入	#8B5CF6	\N	2	2026-08-27 20:53:51.908	2026-08-27 20:53:51.908
cmtc02zz800082wtf8iz239sp	cmtbz960o0000mido6ln0woqv	深度思考	#06B6D4	\N	3	2026-08-27 20:53:51.909	2026-08-27 20:53:51.909
cmtc02zz9000a2wtfc3ezfsgf	cmtbz960o0000mido6ln0woqv	日常生活	#3B82F6	\N	4	2026-08-27 20:53:51.91	2026-08-27 20:53:51.91
\.


--
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.check_ins (id, user_id, item_id, date, status, planned_energy, actual_energy, action_text, notes, created_at, updated_at) FROM stdin;
cmtceelzr000167n7uwg0a2gg	cmtbz960o0000mido6ln0woqv	cmtc02zzu000j2wtf15591lmn	2026-08-28	COMPLETED	\N	NORMAL	完成 15 分钟自重核心训练	\N	2026-08-28 03:34:48.278	2026-08-28 03:34:48.278
cmtcefoav000367n7bc9360ey	cmtbz960o0000mido6ln0woqv	cmtc03009000v2wtfcnb5ydhn	2026-08-28	KEPT	\N	\N	\N	\N	2026-08-28 03:35:37.927	2026-08-28 03:35:37.927
cmtcex0kf0001ap2f9614duqq	cmtbz960o0000mido6ln0woqv	cmtc02zzc000c2wtfrmbtoejj	2026-08-28	COMPLETED	\N	HIGH	阅读 45 分钟并摘录 3 条核心观点到笔记	\N	2026-08-28 03:49:06.975	2026-08-28 03:49:06.975
cmtcex93c0003ap2fx6ss747a	cmtbz960o0000mido6ln0woqv	cmtc03002000p2wtf9kid03vt	2026-08-28	COMPLETED	\N	LOW	在便签上写下此刻最真实的一句话	\N	2026-08-28 03:49:18.024	2026-08-28 03:49:18.024
\.


--
-- Data for Name: daily_energy_states; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_energy_states (id, user_id, date, energy_level, note, created_at, updated_at) FROM stdin;
cmtbz961n000pmidot4qrg334	cmtbz960o0000mido6ln0woqv	2026-08-27	HIGH	\N	2026-08-27 20:30:40.092	2026-08-27 20:33:04.491
\.


--
-- Data for Name: energy_action_presets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.energy_action_presets (id, item_id, energy_level, action_text, description) FROM stdin;
cmtc02zzc000d2wtfwcazieul	cmtc02zzc000c2wtfrmbtoejj	HIGH	阅读 45 分钟并摘录 3 条核心观点到笔记	\N
cmtc02zzc000e2wtfjuml8pzn	cmtc02zzc000c2wtfrmbtoejj	NORMAL	阅读 20 分钟并标记一个有启发的段落	\N
cmtc02zzc000f2wtffg7cfm12	cmtc02zzc000c2wtfrmbtoejj	LOW	读 1 段文字并划线（微小行动，绝非失败）	\N
cmtc02zzc000g2wtf0l6nhqma	cmtc02zzc000c2wtfrmbtoejj	REST	今日有意识休整，不强制阅读	\N
cmtc02zzu000k2wtf98zjyalm	cmtc02zzu000j2wtf15591lmn	HIGH	完成 40 分钟全身抗阻训练 + 10 分钟拉伸	\N
cmtc02zzu000l2wtfm24tm8l6	cmtc02zzu000j2wtf15591lmn	NORMAL	完成 15 分钟自重核心训练	\N
cmtc02zzu000m2wtfa4fwmsw9	cmtc02zzu000j2wtf15591lmn	LOW	站姿拉伸 3 分钟 + 30 次深蹲	\N
cmtc02zzu000n2wtfggzutv6g	cmtc02zzu000j2wtf15591lmn	REST	肌肉完全恢复与温水泡澡	\N
cmtc03002000q2wtfdw15qcwa	cmtc03002000p2wtf9kid03vt	HIGH	写一篇完整的深度日记或思考长文 (800+ 字)	\N
cmtc03002000r2wtfu2wav32d	cmtc03002000p2wtf9kid03vt	NORMAL	记录 3 件今天最有意义的事情与 1 点反思	\N
cmtc03002000s2wtf2qj1dqi4	cmtc03002000p2wtf9kid03vt	LOW	在便签上写下此刻最真实的一句话	\N
cmtc03002000t2wtf59k7jpfv	cmtc03002000p2wtf9kid03vt	REST	仅闭目冥想 5 分钟，无需动笔	\N
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, user_id, title, why_prompt, type, layer, status, frequency_days, target_per_week, due_date, sort_order, color_code, created_at, updated_at, archived_at, custom_category, category_id) FROM stdin;
cmtc02zzc000c2wtfrmbtoejj	cmtbz960o0000mido6ln0woqv	每日深度阅读	构建长期批判性思考力，抗击碎片化信息茧房	HABIT	SIGNAL	ACTIVE	\N	\N	\N	0	#8B5CF6	2026-08-27 20:53:51.912	2026-08-27 20:53:51.912	\N	学习与输入	cmtc02zz700062wtf1qhmqr54
cmtc02zzu000j2wtf15591lmn	cmtbz960o0000mido6ln0woqv	力量与体态恢复训练	保持充沛精力与身体核心稳定性	HABIT	BODY	ACTIVE	\N	\N	\N	0	#10B981	2026-08-27 20:53:51.93	2026-08-27 20:53:51.93	\N	身体与健康	cmtc02zz000022wtf1xmqy437
cmtc03002000p2wtf9kid03vt	cmtbz960o0000mido6ln0woqv	自由书写与日落复盘	理清日常思绪杂质，倾听内在声音	HABIT	CONTEMPLATION	ACTIVE	\N	\N	\N	0	#06B6D4	2026-08-27 20:53:51.938	2026-08-27 20:53:51.938	\N	深度思考	cmtc02zz800082wtf8iz239sp
cmtc03009000v2wtfcnb5ydhn	cmtbz960o0000mido6ln0woqv	睡前 1 小时不刷短视频与社交媒体	保护多巴胺基线，提升深度睡眠质量	QUIT_HABIT	LIFE	ACTIVE	\N	\N	\N	0	#EF4444	2026-08-27 20:53:51.946	2026-08-27 20:53:51.946	\N	日常生活	cmtc02zz9000a2wtfc3ezfsgf
cmtc0300c000x2wtfwdfwy1ei	cmtbz960o0000mido6ln0woqv	提交阶段性产品设计与架构复盘文档	\N	TODO	CRAFT	COMPLETED	\N	\N	2026-08-27	0	#3B82F6	2026-08-27 20:53:51.948	2026-08-28 03:49:23.089	\N	创造与工作	cmtc02zz600042wtffwgwtixx
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, session_token, user_id, expires) FROM stdin;
\.


--
-- Data for Name: tool_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tool_links (id, item_id, title, url, energy_level, description, sort_order) FROM stdin;
cmtc02zzc000h2wtfa4o0k97h	cmtc02zzc000c2wtfrmbtoejj	打开 ReadSelah	https://readselah.com	\N	\N	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified, image, timezone, created_at, updated_at) FROM stdin;
cmtbz960o0000mido6ln0woqv	Demo Runner	demo@habitrunner.dev	\N	\N	Asia/Shanghai	2026-08-27 20:30:40.056	2026-08-27 20:30:40.056
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: check_ins check_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_pkey PRIMARY KEY (id);


--
-- Name: daily_energy_states daily_energy_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_energy_states
    ADD CONSTRAINT daily_energy_states_pkey PRIMARY KEY (id);


--
-- Name: energy_action_presets energy_action_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_action_presets
    ADD CONSTRAINT energy_action_presets_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: tool_links tool_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tool_links
    ADD CONSTRAINT tool_links_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_provider_account_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX accounts_provider_provider_account_id_key ON public.accounts USING btree (provider, provider_account_id);


--
-- Name: categories_user_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_user_id_name_key ON public.categories USING btree (user_id, name);


--
-- Name: check_ins_item_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX check_ins_item_id_date_idx ON public.check_ins USING btree (item_id, date);


--
-- Name: check_ins_item_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX check_ins_item_id_date_key ON public.check_ins USING btree (item_id, date);


--
-- Name: check_ins_user_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX check_ins_user_id_date_idx ON public.check_ins USING btree (user_id, date);


--
-- Name: daily_energy_states_user_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX daily_energy_states_user_id_date_idx ON public.daily_energy_states USING btree (user_id, date);


--
-- Name: daily_energy_states_user_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX daily_energy_states_user_id_date_key ON public.daily_energy_states USING btree (user_id, date);


--
-- Name: energy_action_presets_item_id_energy_level_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX energy_action_presets_item_id_energy_level_key ON public.energy_action_presets USING btree (item_id, energy_level);


--
-- Name: items_user_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX items_user_id_status_idx ON public.items USING btree (user_id, status);


--
-- Name: items_user_id_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX items_user_id_type_idx ON public.items USING btree (user_id, type);


--
-- Name: sessions_session_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sessions_session_token_key ON public.sessions USING btree (session_token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: check_ins check_ins_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: check_ins check_ins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: daily_energy_states daily_energy_states_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_energy_states
    ADD CONSTRAINT daily_energy_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: energy_action_presets energy_action_presets_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_action_presets
    ADD CONSTRAINT energy_action_presets_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tool_links tool_links_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tool_links
    ADD CONSTRAINT tool_links_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Eht4VvXi16iNf9ttthtHb1viqoKNYAZfjBO93amQ06d2EtSjlYJbsQ2BhRLODlj

