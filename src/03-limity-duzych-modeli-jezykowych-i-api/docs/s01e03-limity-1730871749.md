![](https://cloud.overment.com/0103-1730871460.jpeg)

Działanie modeli generatywnego AI jest imponujące, ale nie wiemy jednoznacznie, czy mamy do czynienia z rozumowaniem, czy jedynie powtarzaniem wyuczonych schematów i treści danych treningowych. [Ilya Sutskever](https://x.com/ilyasut) czy [Geoffrey Hinton](https://x.com/geoffreyhinton) uważają, że "skuteczne przewidywanie kolejnego tokenu wymaga faktycznego zrozumienia treści". Z kolei [Yan LeCun](https://twitter.com/ylecun) uważa, że mówimy tutaj jedynie o prymitywnych mechanizmach rozumowania, którym daleko jest od procesów zachodzących w ludzkim mózgu. W sieci łatwo także spotkać głosy mówiące o tym, że duże modele językowe są zwykłym oszustwem, a przeprowadzanie badań nad nimi, spowalnia rozwój technologii.

Poniżej mamy "zagadkę", która tylko pozornie przypomina [popularną łamigówkę](https://en.wikipedia.org/wiki/River_crossing_puzzle) o przekraczaniu rzeki. Normalnie jej trudność uzależniona jest od ograniczeń, które musimy przestrzegać. Jednak w naszym przypadku nie ma wzmianki o żadnym z nich. Pomimo tego model nie jest w stanie tego zauważyć i sugeruje nam skomplikowaną listę kroków. 

![](https://cloud.overment.com/2024-09-10/aidevs3_puzzle-4299a08f-f.png)

Takie zachowanie sugeruje, że nie mamy tutaj do czynienia z rozumowaniem, lecz podążaniem za schematami danych treningowych. To samo widzimy w innym przykładzie, w którym model "twierdzi", że jest w stanie posługiwać się [algorytmem MD5](https://en.wikipedia.org/wiki/MD5) i faktycznie z powodzeniem enkoduje słowo "Hello". Jednak jeśli tylko lekko je zmienimy na "H3llo", to wygenerowany rezultat jest błędny. 

![](https://cloud.overment.com/2024-09-10/aidevs3_md5-b54d04aa-f.png)

Takie problemy dotyczą nie tylko dużych modeli językowych, ale modeli generatywnego AI w ogóle. Poniżej mamy obrazek "pustego pokoju, w którym nie ma słonia" wygenerowany przez Dall-E 3. 

![](https://cloud.overment.com/2024-09-10/aidevs3_elephant-ec6310f4-8.png)

Ponownie widać tutaj zachowanie sugerujące, że z żadną inteligencją nie mamy tutaj do czynienia. Jak więc możemy zaufać modelom, skoro nie możemy polegać na nich w tak prostych sytuacjach? 

Patrząc na to z praktycznego punktu widzenia, trudno jest nie dostrzegać zarówno szerokich możliwości, jak i rażących wad. W dodatku nie mówimy tutaj wyłącznie o umiejętnościach samych modeli, ale także ograniczaniach związanych z nimi technologii czy infrastruktury. Dla podkreślenia tego, o czym teraz mówię, tak wygląda status usług Anthropic z ostatnich 90 dni. Można dodać do niego tylko tyle, że 99.43% dostępności usługi to bardzo optymistyczna wartość.

![](https://cloud.overment.com/2024-09-10/aidevs3_anthropic-55d47b1a-f.png)

Osoby próbujące stawać w obronie generatywnego AI twierdzą, że jest to "dopiero początek" i że modele wciąż się rozwijają, a wszystkie problemy zostaną z czasem rozwiązane. Trudno w tej chwili powiedzieć, czy faktycznie tak się stanie, ale ogólny postęp świetnie oddaje rozwój Midjourney, który dodatkowo można zestawić z modelem takim jak [Flux](https://www.3daistudio.com/blog/FLUX-Image-Generator-for-3D-Models) czy [Recraft v3](https://replicate.com/recraft-ai/recraft-v3)

![](https://cloud.overment.com/2024-09-10/aidevs3_midjourney-0d26fd45-4.png)

Choć nie wiemy, co przyniosą nam kolejne wersje modeli oraz jak będą rozwijały się narzędzia, tak przykłady produktów takich jak Cursor, [Replit Agent](https://docs.replit.com/replitai/agent) czy Perplexity sugerują, że nawet jeśli generatywna sztuczna inteligencja miałaby się całkowicie zatrzymać w rozwoju już dziś, to nadal mamy na czym budować rozwiązania generujące wartość.

Możemy zatem zdecydować się na zastosowanie strategii polegającej na praktycznej pracy z modelami i osobistym doświadczaniu związanych z nimi możliwości. Już teraz możemy z powodzeniem patrzeć na nie jak na narzędzia, które sprawdzają się tylko w wybranych scenariuszach. Dlatego zamiast próbować zastosować je wszędzie tam, gdzie to możliwe, mądrzej jest sięgać po nie tylko tam, gdzie faktycznie mogą nam się przydać. 

No i o tym porozmawiamy dzisiaj. 

## Bazowe ograniczenia modeli

Model Transformer, który stanowi podstawę dużych modeli językowych, oryginalnie powstał w celu **tłumaczenia treści pomiędzy językami**, co sprawia, że jest szczególnie dobry w **transformacji istniejących treści**. Jego kluczowym elementem, jest mechanizm uwagi (eng. attention mechanism, świetnie wyjaśniony na filmie https://www.youtube.com/watch?v=eMlx5fFNoYc), dzięki któremu model utrzymuje skupienie na istotnych fragmentach, zachowując kontekst oraz występujące powiązania. 

![](https://cloud.overment.com/2024-09-10/aidevs3_attention-295880f1-4.png)

Zapoznanie się nawet z ogólnymi mechanizmami modelu Transformer pozwala zrozumieć, że mamy do czynienia z mechanizmem naśladującym ludzki mózg, a nie z ludzkim mózgiem. Oznacza to, że w niektórych zadaniach będzie lepszy niż człowiek, a w innych wręcz przeciwnie.

W ostatnich latach firmy rozwijające duże modele językowe, powstrzymują się od publikowaniem szczegółów na temat architektury. Jednak z dość dużym prawdopodobieństwem możemy podejrzewać, że modele takie jak GPT-4 wykorzystują koncepcję "[Mixture of Experts](https://developer.nvidia.com/blog/applying-mixture-of-experts-in-llm-architectures/)". Zakłada ona, że model językowy składa się z sieci wyspecjalizowanych w określonych zadaniach, a jedna z nich (router) odpowiada za wybór tych, które najbardziej pasują do danego zadania.

![](https://cloud.overment.com/2024-09-10/aidevs3_moe-606b42ab-8.png)

Prawdopodobnie (nie mam na to dowodu) dlatego skuteczność działania modelu spada dla określonych zadań, gdy wymagamy odpowiedzi w określonym formacie, np. JSON Mode, co zostało opisane w [Let me speak Freely?](https://arxiv.org/abs/2408.02442v1). Można podejrzewać, że w takiej sytuacji uwaga modelu skupia się bardziej na sposobie zapisu, niż faktycznym zadaniu. To może prowadzić do wniosku, że uzasadnione będzie rozbijanie zadań na mniejsze etapy. Poza tym, sprzyja to także utrzymaniu uwagi na głównych instrukcjach.

No i w tym wszystkim należy także pamiętać, że duże modele językowe poznają świat w oparciu o dane (początkowo wyłącznie tekst, a teraz także przez inne formaty). W związku z tym trudniej przychodzi im zrozumienie tego, co jako ludzie uczymy się poprzez doświadczanie. Sytuacji nie ułatwia fakt, że zamiast słowami, posługują się tokenami, które również przyczyniają się do wielu problemów.

Powyższe zagadnienia związane z architekturą modeli bezpośrednio wiążą się z ich możliwościami oraz ograniczeniami. Dobrze jest mieć je na uwadze podczas projektowania aplikacji oraz promptów, co staram się pokazywać w każdym z prezentowanych przykładów.

Podsumowując tę część: 

- Łatwiej jest **transformować istniejące treści**, niż generować nowe.
- Łatwiej jest **weryfikować treści**, niż je transformować.
- Modele poznają świat przez treści, a nie przez wszystkie zmysły.
- Mechanizmy utrzymywania uwagi, rozpoznawania kontekstu i powiązań są imponujące, lecz mają swoje braki.
- "Przewidywanie kolejnego tokenu" wymaga jakiegoś stopnia rozumienia treści, a to wymaga generalizacji / kompresji informacji, co z kolei wiąże się ze zdolnością do zauważania wzorców.

## Koszty, Rate Limit i Debugowanie

Limity możliwości modeli to nie jedyne wyzwanie. Ponieważ korzystanie z modeli językowych jest płatne i rozliczane na podstawie przetworzonych tokenów, konieczna jest kontrola wydatków, zwłaszcza w zespole. Jeszcze do niedawna ustawienie limitów nie było możliwe na poziomie dostawcy, lecz wiązało się ze zbudowaniem własnego rozwiązania ograniczającego dostęp do kluczy API. Teraz niemal wszystkie usługi oferują pewien poziom kontroli kosztów z poziomu panelu (mowa tutaj także o Anthropic i OpenAI), albo z uwzględnieniem samego projektu, albo indywidualnych użytkowników.

![](https://cloud.overment.com/2024-09-10/aidevs3_workspace-c5c591ef-f.png)

Ustawienie limitów dla użytkownika jest krytyczne, ponieważ zwykła pomyłka w kodzie może doprowadzić do wykorzystania dostępnego budżetu już na etapie developmentu, o produkcji nie wspominając. 

W zależności od sytuacji, dobrym rozwiązaniem jest korzystanie tam gdzie to możliwe, z tańszych wersji modeli, których ceny już teraz są bardzo niskie (np. [Gemini Flash](https://github.com/google-gemini/gemini-api-quickstart)).

Po udostępnieniu aplikacji użytkownikom, poza kosztami, problemem staje się także "rate limit", czyli ograniczenia liczby zapytań do API, które zwykle obejmują:

- liczbę tokenów na minutę / dzień
- liczbę zapytań na minutę / dzień

Limity różnią się w zależności od modelu, dostawcy oraz poziomu konta (tzw. tier), który wzrasta z czasem. Gdy zależy nam na szybszym dostępie do większych limitów, możliwe jest skontaktowanie się z obsługą klienta w celu indywidualnego rozpatrzenia sprawy i/lub skorzystanie z usług takich jak Amazon Bedrock czy Azure OpenAI Service. Tak czy inaczej, limity wydatków oraz dostępu do API musimy traktować poważnie, bo po publikacji aplikacji na produkcji, trudno jest zaadresować ten temat w krótkim czasie.

Poza sztywnymi limitami, w pracy z modelami językowymi interesuje nas także faktyczne zużycie tokenów oraz estymacja kosztów działania aplikacji. Obecnie najlepszym rozwiązaniem do tego celu jest skorzystanie z narzędzi monitorujących, takich jak wspomniany już LangFuse, [LangSmith](https://smith.langchain.com/), [Portkey](https://portkey.ai/), [Parea](https://www.parea.ai/) czy inne (sam korzystam z LangFuse). Dzięki nim mamy wgląd zarówno w ogólne statystyki przetworzonych tokenów, jak i tokenów potrzebnych do wykonania poszczególnych zapytań. 

![Przykład panelu langfuse monitorującego aplikację wykorzystującą generatywne AI](https://cloud.overment.com/2024-09-11/aidevs3_monitoring-2d7991a0-c.png)

Połączenie z LangFuse możliwe jest albo bezpośrednio przez API lub SDK (wówczas musimy sami zadbać o przekazanie kompletu informacji do monitorowania), albo poprzez dostępne integracje, które zdejmują z nas część obowiązków. Choć w przykładzie [`langfuse`](https://github.com/i-am-alice/3rd-devs/tree/main/langfuse) korzystamy z interfejsu dla JavaScript, to kluczowa do zrozumienia jest wyłącznie koncepcja, która polega na stworzeniu kilku metod z pomocą których będziemy mogli wysyłać zdarzenia. Szczegóły samej platformy LangFuse omawiam w poniższym filmie. 

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1008437926?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="01_03_langfuse"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

Także podsumowując, połączenie aplikacji z Langfuse polega na przesyłaniu danych dla każdego zapytania, z uwzględnieniem interakcji z modelem oraz akcji powiązanych z działaniem modelu. Inaczej mówiąc — przesyłamy wszystko to, co pomoże nam zrozumieć zachowanie modelu. Szczególnie przydatna jest możliwość debugowania promptów, o czym wspominałem także w lekcji S00E04 — Programowanie.

## Limity okna tokenów

Chociaż monitorowanie liczby przetwarzanych tokenów i związanych z tym kosztów mamy już za sobą, samo przeliczanie tokenów to proces, który wciąż nas interesuje. Chodzi konkretnie o posiadanie tej informacji w kodzie aplikacji, co jest istotne zarówno ze względu na limit Context Window omówiony w lekcji S00E02 — Prompt Engineering, jak i pracę z dokumentami, których rozmiar będziemy chcieli poznać.

Zarówno z wcześniejszych edycji AI_devs, jak i materiałów wdrożeniowych, narzędzie Tiktokenizer powinno być Ci już znane. Teraz musimy wykorzystać je w kodzie aplikacji, aby poprawnie liczyć tokeny.

W przypadku OpenAI do dyspozycji mamy nową bibliotekę bezpośrednio od Microsoftu, o nazwie [Tokenizer](https://github.com/Microsoft/Tokenizer). W jej kodzie źródłowym znajdziemy listę encoderów, wykorzystywanych przez poszczególne modele, z pomocą których możemy poznać liczbę tokenów dla określonych danych.

![](https://cloud.overment.com/2024-09-11/aidevs3_encoding-7b7a0d7a-9.png)

Poza encoderem, pod uwagę musimy wziąć także tokeny specjalne, odpowiedzialne za strukturyzowanie treści przekazywanych do modelu. Mowa konkretnie o tokenach widocznych poniżej, uwzględniających zarówno tagi <|im_start|> jak i słowa kluczowe takie jak `system` czy `user`. 

![](https://cloud.overment.com/2024-09-11/aidevs3_tokens-3ea1a1ee-3.png)

W przykładzie [`tiktokenizer`](https://github.com/i-am-alice/3rd-devs/tree/main/tiktokenizer), w pliku `OpenAIService.ts` znajduje się logika odpowiedzialna za liczenie tokenów dla przekazanej listy wiadomości oraz konkretnego modelu. Całość uwzględnia także wspomniane tokeny specjalne, które również mogą różnić się w zależności od modelu i jego encodera. 

![](https://cloud.overment.com/2024-09-11/aidevs3_tiktokenizer-8e152463-4.png)

Przeliczanie tokenów obowiązuje także w przypadku obrazów, lecz w tym przypadku opieramy się nie o tokenizer, lecz reguły opisane na stronie [OpenAI](https://platform.openai.com/docs/guides/vision/calculating-costs) lub instrukcji innych dostawców. 

![](https://cloud.overment.com/2024-09-11/aidevs3_vision-4921141a-a.png)

Do tego tematu będziemy jeszcze kilkukrotnie wracać na przestrzeni AI_devs 3. Tymczasem uruchom przykład [`tiktokenizer`](https://github.com/i-am-alice/3rd-devs/tree/main/tiktokenizer) i wyślij do niego przykładowe zapytanie, a następnie porównaj wynik z narzędziem Tiktokenizer dostępnym online. 
## Limity generowanych treści

W lekcji S00E02 — Prompt Engineering mówiliśmy o limicie tokenów w przypadku wypowiedzi modelu, który dla modelu GPT-4o wynosi zaledwie 4096 tokenów. W przypadku modeli Claude już teraz możemy uzyskać nawet 16 000 tokenów, jednak z praktycznego punktu widzenia, nie zawsze będzie to wystarczające. Wystarczy sytuacja w której będziemy chcieli wprowadzić korektę, tłumaczenie czy dowolną inną transformację na tekście, który swoją objętością przekracza limit modelu. 

W takiej sytuacji mamy kilka możliwości: 

- podzielić długi tekst na mniejsze fragmenty, z których każdy będzie krótszy niż dopuszczalny limit wypowiedzi modelu
- programistycznie wykrywać powód zakończenia wypowiedzi modelu i poprosić o kontynuację

Pierwszym rozwiązaniem zajmiemy się w dalszej części kursu, natomiast drugie już teraz można zobaczyć w przykładzie [`max_tokens`](https://github.com/i-am-alice/3rd-devs/tree/main/tiktokenizer). Ograniczyłem tam celowo długość wypowiedzi modelu do zaledwie `50 tokenów`. Jeśli zatem wyślemy zapytanie z wiadomością "**Write ten sentences about apples and put them in order**", to domyślnie zadanie to nie zostanie wykonane poprawnie i zakończy się informacją o przekroczeniu wartości [`max_tokens`](https://github.com/i-am-alice/3rd-devs/tree/main/tiktokenizer), co widać poniżej.

![](https://cloud.overment.com/2024-09-11/aidevs3_max_tokens-e7f99304-6.png)

Możemy więc programistycznie wykryć ten powód i automatycznie kontynuować konwersację, dołączając do niej prośbę o dalszą wypowiedź, zaczynającą się od znaku kończącego ostatnią wiadomość.

![](https://cloud.overment.com/2024-09-11/aidevs3_continuous-f946de17-0.png)

Choć pierwsza strategia związana z podziałem treści na mniejsze fragmenty jest bardziej skuteczna, tak powyższy scenariusz również można brać pod uwagę. Zadziała on jednak tylko w przypadku modeli, w przypadku których możemy liczyć na precyzyjne podążanie za instrukcjami (np. GPT-4o).

W przykładzie [`max_tokens`](https://github.com/i-am-alice/3rd-devs/tree/main/tiktokenizer) warto także zwrócić uwagę na plik `app.ts`, gdzie znajduje się logika sprawdzająca, czy suma tokenów promptu oraz wypowiedzi modelu nie przekracza limitu kontekstu okna. Takie zapytanie i tak skończyłoby się błędem ze strony API, natomiast warto pamiętać o tym, aby precyzyjnie liczyć prompty i brać pod uwagę limity tokenów dla modelu, z którym pracujemy.

![](https://cloud.overment.com/2024-09-11/aidevs3_window-f8f57234-f.png)

## Narzucanie własnych ograniczeń

Nie wszystkie ograniczenia będą wynikać z ograniczeń samego modelu czy narzędzi, ale z naszej własnej potrzeby. Może nam w końcu zależeć na tym, aby model odmawiał realizacji wybranych zadań lub ściśle trzymał się wytycznych opisanych w prompcie.

W tym miejscu należy jednak pamiętać, że w przypadku LLM mówimy jedynie o możliwości sterowania zachowaniem modelu, a nie pełnej kontroli. W dodatku przetwarzanie języka naturalnego wiąże się z tym, że dość łatwo jest znaleźć obejście pewnych zasad, o czym mówiliśmy w lekcji S00E02 — Prompt Engineering i technikach Prompt Injection czy Jailbreaking'u. 

Pierwszym przykładem ograniczeń, z których możemy chcieć skorzystać, jest Moderation API dostępne w OpenAI. Co prawda weryfikuje ono treści pod kątem zgodności z polityką tej firmy, ale i tak pozwala filtrować różne kategorie niepożądanych treści, takich jak np. przemoc. 

![](https://cloud.overment.com/2024-11-05/aidevs3_moderation-8b110f2e-c.png)

Zastosowanie Moderation API polega wyłącznie na wysłaniu jednego zapytania [opisanego w dokumentacji](https://platform.openai.com/docs/guides/moderation/quickstart), więc nie będziemy się nim zajmować. Warto jednak wiedzieć, że za moderację odpowiada model `omni-moderation-latest`, który ma ograniczoną liczbę tokenów i jest podatny na jailbreaking. Sugeruje to, że na pewnym etapie możemy być zainteresowani zbudowaniem własnego modelu, który będzie oceniał zapytania według naszego regulaminu i zasad.

Bardziej elastyczną strategią narzucania własnych ograniczeń, jest wprowadzenie dodatkowych promptów **oceniających** i/lub **weryfikujących**, których zadanie będzie skupiać się wyłącznie na ocenie zapytania użytkownika i/lub wypowiedzi modelu, pod kątem naszych własnych zasad. Co ciekawe, wprowadzając własną skalę ocen, możemy programistycznie blokować zapytania, które spróbują nadpisać logikę naszego promptu. 

Konkretnie, w przykładzie [`constitution`](https://github.com/i-am-alice/3rd-devs/tree/main/constitution) znajduje się przykład weryfikacji zapytania użytkownika. Jest ono sprawdzane pod kątem tego, czy wiadomość została napisana w języku polskim. Zadaniem modelu jest zwrócenie słowa `block` lub `pass`, które jest następnie weryfikowane programistycznie z pomocą instrukcji warunkowej `if`. 

![](https://cloud.overment.com/2024-09-12/aidevs3_prompt-a3077398-0.png)

Oznacza to, że jeśli cokolwiek zaburzy działanie naszego promptu i zwrócona wartość nie będzie równa dokładnie `pass`, to zapytanie zostanie odrzucone. 

Podobny prompt moglibyśmy uruchomić także na odpowiedzi zwracanej przez model, aby dodać kolejną warstwę moderacji. Co więcej, mówimy tutaj o **zupełnie oddzielnych promptach**, które są wykonywane w tle, a więc użytkownik nie ma do nich fizycznego dostępu.

Niestety, nie jest to perfekcyjne zabezpieczenie przed prompt injection, ponieważ treść przesłana do modelu może być sfabrykowana, aby je ominąć. Poza tym może się okazać, że przypadkowo blokujemy zapytania, które w żaden sposób nie naruszają naszych zasad, ale model niepoprawnie je ocenił.

Nie zmienia to jednak faktu, że ocena wygenerowanej treści jest dobrym sposobem na zwiększenie stabilności działania aplikacji. Może być wykorzystywana nie tylko w kontekście bezpieczeństwa, ale także samej oceny rezultatów zwróconych przez model. Jak powiedziałem — **łatwiej jest oceniać treść, niż ją generować.** W rezultacie możemy w ten sposób wspierać rozumowanie modelu. 

Nim przejdziemy dalej dodam, że w prompcie oceniającym, bardzo wskazane jest dodanie przestrzeni na "zastanowienie się". Możemy to zrobić albo poprzez oczekiwanie formatu JSON, albo poprzez format widoczny poniżej. Polega on na zastosowaniu tagów `<thinking>` oraz `<result>`, w których model może wpisać oczekiwaną treść, a następnie z pomocą wyrażenia regularnego możemy pobrać rezultat. 

![](https://cloud.overment.com/2024-09-12/aidevs3_thinking-a1f4a662-0.png)

W bloku `<thinking>` model generując uzasadnienie, stopniowo **zwiększa prawdopodobieństwo tego**, że kolejne tokeny będą wygenerowane zgodnie z naszymi zasadami. Jest to jedna z najlepszych technik wzmacniania rozumowania modelu, szczególnie gdy połączymy ją z oceną rezultatu. Trzeba tylko zadbać o to, aby "pokazać modelowi jak ma myśleć", czyli przedstawić kilka przykładów zawartości bloku "thinking". W przeciwnym razie zwykle wygeneruje tam mało wartościową treść.
## Wydajność działania modeli

Jeszcze jakiś czas temu, LLM stanowiły najwolniejszy element aplikacji, co było dużym ograniczeniem. Natomiast obecnie zaczyna się to zmieniać z przynajmniej dwóch powodów — rozwoju małych modeli zdolnych do działania na urządzeniach mobilnych oraz rozwoju sprzętu do inferencji oferowanych przez platformy takie jak Groq czy [Cerebras](https://cloud.cerebras.ai/). Niestety żadna z nich nie posiada jeszcze planu możliwego do kupienia na stronie.

W repozytorium [LLMPerf Leaderboard](https://github.com/ray-project/llmperf-leaderboard?tab=readme-ov-file) prowadzone są statystyki na temat popularnych platform cechujących się szybkością inferencji. Jednak równie ważnym wskaźnikiem jest `time to first token`, czyli czas reakcji. Poza tym, część z tych usług narzuca także dość agresywne limity, co również negatywnie przekłada się na czas wykonywanych zadań.

W jednym z początkowych przykładów materiału wdrożeniowego o nazwie "completion" analizowaliśmy kilka zadań pod kątem nadania im etykiet. W celu optymalizacji czasu realizacji wszystkie klasyfikacje zostały uruchomione równolegle. Takie podejście faktycznie zwiększa wydajność aplikacji, lecz naraża nas na przekroczenie limitów zapytań oraz limitu przetworzonych tokenów w czasie.

![](https://cloud.overment.com/2024-09-12/aidevs3_parallel-c0b64d59-7.png)

Limity zwykle są znacznie większe w przypadku mniejszych modeli, które także działają zdecydowanie szybciej niż mocniejsze wersje. Dlatego w kontekście optymalizacji wydajności aplikacji, warto zadać sobie pytania takie jak: 

- Jak możemy zaprojektować logikę, aby realizować jak najwięcej zapytań równolegle?
- Czy możemy skorzystać z mniejszego, szybszego modelu, nawet kosztem bardziej obszernych promptów?
- Czy możemy skorzystać z mechanizmu cache'owania promptu w celu zmniejszenia czasu reakcji (np. w przypadku modeli Anthropic)?
- Czy możemy skorzystać z platform oferujących szybką inferencję?
- Czy w ogóle będzie zależało nam na wydajności, bo np. część z zadań może być realizowana w tle?
- Czy wszystkie z zadań musi realizować model i czy możemy przynajmniej część logiki, przenieść na kod (np. przez wyrażenia regularne)?

Na koniec warto dodać, że szybkość inferencji wzrasta z czasem. Możliwe jest jednak, że będziemy obserwować cykle, w których nowe modele będą wolniejsze, a czasem będą optymalizowane i ich szybkość wzrośnie. Choć poniższy obraz może nie w pełni oddawać stanu faktycznego, z pewnością wizualizuje ostatnie lata rozwoju dużych modeli językowych.

![](https://cloud.overment.com/2024-09-12/aidevs3_cycles-8eebe210-4.png)

## Modele niecenzurowane

Duże modele językowe domyślnie posiadają szereg ograniczeń i limitów, które nie wynikają z ich natury, lecz działań podjętych przez ich twórców w związku z bezpieczeństwem. Takie ograniczenia obecne są także w modelach Open Source, jednak wśród nich powstaje grupa modeli `uncensored`, które wspomnianych ograniczeń nie posiadają lub łatwo można je ominąć. Przykładem takich modeli może być Dolphin tworzony na podstawie innych modeli (np. Llama czy Mistral) przez firmę [Cognitive Computations](https://x.com/cognitivecompai) lub Grok tworzony przez [x.ai](https://x.ai/).

Modele niecenzurowane mogą kojarzyć się ze zdolnością do generowania treści powszechnie uznawanych za niewłaściwe lub odpowiadanie na pytania mogą ce stanowić zagrożenia z punktu widzenia bezpieczeństwa. Jest to prawda, ale też samo cenzurowanie może wchodzić w obszary, które będziemy chcieli zaadresować, nie mając przy tym złych intencji. Nietrudno się domyślić, że temat niecenzurowanych modeli sam w sobie jest kontrowersyjny i [warto zapoznać się z perspektywą osoby stojącej za serią modeli Dolphin](https://erichartford.com/uncensored-models).

Poniżej mamy różnicę w zachowaniu modelu `Claude 3.5 Sonnet` oraz `dolphin-llama3:70b`. W przypadku tego pierwszego, wygenerowanie konwersacji pomiędzy dwójką polityków zakończyło się odmową, a ten drugi nie miał z tym problemu. 

![](https://cloud.overment.com/2024-09-12/aidevs3_censored-fd00752d-b.png)

![](https://cloud.overment.com/2024-09-12/aidevs3_uncensored-3ca3b75d-d.png)

W tej chwili może nasunąć się tutaj na myśl problem botów szerzących dezinformację w Internecie czy oszukujących ludzi w wiadomościach prywatnych. Są to realne zagrożenia, których w jakimś stopniu doświadcza każdy.

Z drugiej strony są sytuacje biznesowe, które domyślnie nie będą mogły być zaadresowane przez cenzurowane modele. Przykładem może być korekta książek z kategorii kryminałów lub thrillerów, w których można natrafić na zwroty i opisy scen, które są blokowane przez chociażby Moderation API.

Oczywiście, warto zachować rozsądek i odpowiedzialnie pracować z modelami niecenzurowanymi. W przypadku modeli komercyjnych większość niepożądanych treści jest blokowana, a tutaj sami musimy o to zadbać.

Jeśli chodzi o samo uruchomienie modeli takich jak Dolphin, obecnie są one dostępne przez ollama oraz Hugging Face, i praca z nimi nie różni się od pozostałych modeli. Wyjątek stanowi prompt systemowy, który powinien podkreślać dopuszczanie wybranych zachowań, w tym także sposób wypowiedzi.

## Podsumowanie

Na przestrzeni ostatnich kilkunastu miesięcy, możliwości dużych modeli językowych stale wzrastały, albo w wyniku pojawiających się nowych wersji, albo ze względu na nowe techniki projektowania promptów. Podobnie też zwiększały się różne parametry, takie jak limit okna kontekstu czy liczba generowanych tokenów. 

Faktycznie trudno jest porównywać komfort pracy z modelami, pomiędzy tym, co mamy teraz, a tym czego doświadczaliśmy rok czy dwa lata temu. Pomimo tego, dzisiejsza lekcja pokazała nam, że ograniczenia dalej istnieją, a część z nich sami będziemy chcieli utrzymać. Zatem podsumowując temat ograniczeń: 

- Monitorowanie aplikacji, przetworzonych tokenów oraz kosztów jest **krytyczne** zarówno z technologicznego, jak i biznesowego punktu widzenia
- Kontrolowanie liczby tokenów dla przetwarzanej treści, a także limitu zapytań, również pozwoli nam uniknąć niepotrzebnych kosztów. Tutaj mowa o korzystaniu z `tokenizera` z ustawieniami dla aktualnego modelu
- Limity platform (szybkość, rate limit, czas reakcji, stabilność) stanowią ogromny problem na produkcji. I choć sytuacja poprawia się z miesiąca na miesiąc, należy już na początkowym etapie uwzględnić ją w swoim planie
- Moderacja treści trafiających do modelu oraz treści generowanych przez model, to proces który nie zapewnia 100% bezpieczeństwa i przewidywalności, lecz znacząco poprawia jakość działania aplikacji
- Optymalizacja wydajności aplikacji wiąże się ze zmianami projektowymi, dzięki którym zapytania do modelu będą wykonywane równolegle, bądź w tle.
- Nie wszystkie zadania musimy realizować z pomocą najlepszego modelu
- Nie wszystkie zadania wymagają zaangażowania **jakiegokolwiek modelu**

Jeśli z tej lekcji masz zrobić tylko **jedną rzecz**, to zapoznaj się z filmem na temat LangFuse i uruchom przykład o tej samej nazwie (`langfuse`) na swoim komputerze.