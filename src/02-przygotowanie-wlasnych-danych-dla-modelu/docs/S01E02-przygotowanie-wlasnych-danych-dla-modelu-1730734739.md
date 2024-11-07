![](https://cloud.overment.com/S01E02-1725905893.png)

Przynajmniej kilkukrotnie tworzyliśmy prompty, które [sterowały "snem" modelu](https://twitter.com/karpathy/status/1733299213503787018?lang=en) poprzez dane dostarczone do instrukcji systemowej. Pozwala to rozszerzać wiedzę modelu, a nawet nauczyć go nowych umiejętności (np. klasyfikacji).

Zewnętrzne dane mogą być wpisane do promptu systemowego ręcznie, ale także mogą pojawić się w nim automatycznie, czego przykładem jest dość powszechnie znany RAG, czyli Retrieval-Augmented Generation.

W generatywnych aplikacjach kontekst zwykle pochodzi z bazy danych, zewnętrznego API, treści plików lub ze wszystkich tych źródeł jednocześnie. Każdy, kto ma za sobą pierwsze aplikacje łączące model z zewnętrznymi źródłami danych, wie, że wiążą się z tym interesujące możliwości, ale także szereg trudności, które po części zaadresujemy w tej lekcji.

W lekcji S00E04 omawialiśmy przykład `completion`, którego celem było sklasyfikowanie zadania do jednej z trzech kategorii - **praca / dom / inne**. Było to mało praktyczne, ponieważ zwykle zadania przypisujemy do jednego z naszych projektów lub zdefiniowanych przez nas etykiet. Sam zarządzam zadaniami w [Linear](https://linear.app/), a faktyczna lista kategorii, wygląda u mnie następująco: 

![Lista kategorii wraz z nazwami, identyfikatorami oraz opisami](https://cloud.overment.com/2024-09-09/aidevs3_categories-a275042b-7.png)

W większości przypadków nowe zadania dodają się automatycznie na podstawie wiadomości, które przesyłam do mojego Agenta AI. Zdarza się jednak, że dopisuję je ręcznie w Linear. Wówczas uruchamia się webhook, na którym działa kod podobny do tego z przykładu [`linear`](https://github.com/i-am-alice/3rd-devs/tree/main/linear), w celu automatycznego przypisania projektu.

![](https://cloud.overment.com/No-Text-in-Clipboard-1725892198.gif)

Szczególnie interesująca jest funkcja `assignProjectToIssue` w której nie tylko wybierany jest projekt, ale także **programistycznie weryfikujemy poprawność identyfikatora** i w razie potrzeby, ustawiamy jego wartość na domyślną. 

![](https://cloud.overment.com/2024-09-09/aidevs3_assign-79f809f8-a.png)

Przykład [`linear`](https://github.com/i-am-alice/3rd-devs/tree/main/linear) pokazuje nam zatem, że programistyczne wykorzystanie dużych modeli językowych faktycznie sięga dalej niż interfejs czatu. No bo w tym przypadku, proces klasyfikacji miał miejsce jedynie **w odpowiedzi na akcję użytkownika**, a nie jego bezpośrednią wiadomość. W dodatku do klasyfikacji dojdzie tylko wtedy, jeśli użytkownik sam nie ustawił projektu (i również jest to programistycznie sprawdzane).

Także nawet jeśli problem niedeterministycznej natury modeli jest trudny do rozwiązania, to nadal możemy skorzystać z ich możliwości w taki sposób, aby **wspierały istniejące aktywności** lub **częściowo autonomicznie** realizowały jakiś proces.

W powyższej automatyzacji, informacje na temat dostępnych projektów i zasad ich wybierania, zostały zapisane **ręcznie w prompcie**, w sekcji `context`. 

![](https://cloud.overment.com/2024-09-09/aidevs3_projects-3ca1bb2d-9.png)

Nie zawsze tak będzie. W zamian, kontekst będzie wczytywany **dynamicznie** z wielu źródeł, co nierzadko będzie wymagało dodatkowej transformacji treści. No ale zacznijmy od początku.
## Rekomendowane formaty wymiany danych

Duże Modele Językowe nie mogą czytać plików binarnych jak PDF czy DOCX, więc musimy je przekonwertować, aby dostarczyć je w zrozumiałej formie. W zależności od dokumentu, może to oznaczać utratę formatowania, co przekłada się na ryzyko błędnej interpretacji treści. Nawet pojawienie się obrazu czy zewnętrznego odnośnika utrudnia zrozumienie zawartości pliku. Każda związana z tym niejasność zwiększa wprost ryzyko konfabulacji i obniża skuteczność naszego systemu.

Jeśli masz doświadczenie w przetwarzaniu dokumentów PDF, wiesz, że trudno mówić o uniwersalnym parserze. Ale zbudowanie narzędzia do rozpoznawania określonych szablonów czy odnajdywania konkretnych informacji jest zazwyczaj możliwe. Obecność dużych modeli językowych dodatkowo przesuwa granicę tego, co do tej pory było uznawane za możliwe, ale nie rozwiązuje wszystkich problemów.

Przykładem może być poniższy zrzut ekranu z treścią lekcji AI_devs 3, zapisanej w [notion](https://www.notion.so/). Dzięki [notion-to-md](https://www.npmjs.com/package/notion-to-md) możemy pobrać ją w formie otwartego formatu markdown. Sugeruje to zatem, że cała jej treść, łącznie z obrazkami, będzie dostępna dla LLM.

![](https://cloud.overment.com/2024-09-08/aidevs3_files-cecc0ce7-6.png)

Okazuje się jednak, że tak nie jest, bo wczytanie załączników wymaga logowania, czego model językowy domyślnie nie jest w stanie zrobić. Obrazek poniżej jest tylko jednym z przykładów tego, że **zawsze będzie nam zależało na dokładnej weryfikacji, czy mamy swobodny dostęp do treści.** W przypadku Notion jest to możliwe poprzez wygenerowanie tymczasowego linku, ale nie zawsze tak będzie.

![](https://cloud.overment.com/2024-09-08/aidevs3_locked-f6280053-1.png)

Samo dotarcie do treści nie jest jedynym problemem, który przed nami stoi. LLM będziemy wykorzystywać również w celu **transformacji istniejących dokumentów**, co w przypadku formatów binarnych (np. PDF) ponownie jest utrudnione. 

Zatem już na początkowym etapie musimy odpowiedzieć sobie na pytania: 

- **Źródło:** Skąd pochodzą dane i jak często się zmieniają? Czy będą odczytywane bezpośrednio ze źródła, czy musimy zapisać ich wersje po stronie aplikacji i regularnie aktualizować? A może dane będą tworzone i mamy dużą kontrolę nad ich strukturą?
- **Organizacja:** Jak wygląda struktura danych, w tym także powiązania, np. ze źródłem, użytkownikami oraz pozostałymi danymi. Co poza główną treścią powinniśmy wiedzieć na ich temat oraz co o nich powinien wiedzieć model?
- **Dotarcie:** Dla kogo dane będą dostępne i w jaki sposób będziemy je przeszukiwać oraz filtrować? Jakie narzędzia będą zaangażowane w ten proces? 
- **Dostarczenie:** Jak dane będą prezentowane modelowi i czy proces ten będzie rozłożony na kilka etapów (np. w celu podsumowania dużego dokumentu). Czy dane będą przetwarzane indywidualnie czy w połączeniu z innymi informacjami?
- **Prezentacja / Zapis:** Co się dzieje z rezultatem zwróconym przez model? W jakim formacie zostaną one zapisane i/lub przedstawione użytkownikowi? Czy poza odpowiedzią modelu, musimy zapisać coś jeszcze? 
- **Modyfikacja**: Czy oryginalne dane mają zostać nadpisywane? W jaki sposób będziemy mogli odwrócić działanie modelu? Jakie ograniczenia narzuca na nas format danych? Jak możemy ograniczyć ryzyko błędu (np. przez nadzór człowieka)?

Powyższe pytania prowadzą nas do wniosku, że warto dążyć do pracy z formatami otwartymi, takimi jak **markdown, txt, json czy yaml**, a także bezpośrednio z bazami danych. Projekty, w których do gry wchodzą formaty binarne lub z innego powodu dostęp do informacji jest utrudniony, będą musiały być wyspecjalizowane w określonym zadaniu. Czasem może okazać się, że już po wstępnej weryfikacji dany projekt jest nieopłacalny w dalszej realizacji.
## Transformacja i kompresja treści

Przykład `websearch`, który omawialiśmy w lekcji S01E01 — Interakcja pozwalał na połączenie dużego modelu językowego z wynikami wyszukiwania /w Internecie oraz wybranymi stronami www.

Oryginalnie treść strony www zapisana jest w formacie HTML i zawiera szereg niepotrzebnych (z punktu widzenia modelu) tagów. Dzięki FireCrawl od razu otrzymywaliśmy oczyszczoną strukturę Markdown, natomiast w praktyce często będziemy przeprowadzać podobne transformacje sami.

Dla przykładum, dokument PDF (o prostej strukturze), może zostać przekonwertowany do HTML, a HTML do markdown. W takiej formie treść może zostać zmieniona przez LLM, który potrafi formatować wypowiedzi z pomocą tej składni. Następnie odwracamy proces, aby uzyskać oryginalny format PDF. 

![](https://cloud.overment.com/2024-09-08/aidevs3_format-41aa0985-3.png)

Powyższy mechanizm nie sprawdzi się w przypadku złożonych struktur PDF, ale sama koncepcja konwertowania formatów może okazać się użyteczna także w innych sytuacjach. Jedną z nich może być generowanie formatu YAML, zamiast JSON, o czym wspominał Andrej Karpathy w filmie [Let's build tokenizer together](https://www.youtube.com/watch?v=zduSFxRajkE), wskazując, że składania YAML może być znacznie bardziej przyjazna modelowi ze względu na proces tokenizacji. 

Dla prostego obiektu JSON, mówimy o 30% różnicy tokenów (według Tiktokenizer i modelu GPT-4o), których model nie musi generować, jeśli zapiszemy te dane w formacie YAML. To przekłada się także na niższe koszty, oraz krótszy czas inferencji. 

![](https://cloud.overment.com/2024-09-08/aidevs3_json-9bcdd6a2-c.png)

![](https://cloud.overment.com/2024-09-08/aidevs3_yaml-bbd44918-3.png)

Zatem pracując z różnymi formatami danych, zawsze w pierwszej kolejności warto zadać sobie pytanie o to, czy możemy dokonać transformacji do bardziej przyjaznej formy. To samo dotyczy obrazów, plików audio oraz wideo i o tym wszystkim, będziemy jeszcze mówić. 

Transformacja i oczyszczanie danych to nie tylko kwestia oszczędności tokenów, ale także zarządzania uwagą modelu, która nie musi być rozproszona na niepotrzebne informacje. Choć zdolność zarządzania uwagą jest stale optymalizowana, nadal trzeba ją mieć na uwadze, szczególnie w przypadku modeli Open Source.

Do dyspozycji mamy także różne rodzaje kompresji, które mogą być zrealizowane programistycznie lub z pomocą modelu językowego. Najbardziej klasycznym przykładem, który można spotkać w Internecie, jest **podział dokumentu na mniejsze fragmenty (tzw. Chunking)**. Problem w tym, że w wyniku "pocięcia" pliku, możemy zgubić istotny kontekst, co prowadzi do konfabulacji lub generowania poprawnych, ale niekompletnych odpowiedzi.

W zamian możemy przeprowadzić bardziej zaawansowane przetwarzanie treści pliku, analizując go w całości, często kilkukrotnie, aby wygenerować nowe dane. Mowa tutaj o utworzeniu notatek na temat omawianych koncepcji, definicji czy problemów. W rezultacie, zamiast zestawiać zapytanie użytkownika z oryginalną treścią pliku, rolę kontekstu przejmują wygenerowane notatki. Przykład takiego podejścia widać poniżej, gdzie z wgranego pliku zostaje wygenerowane ogólne podsumowanie i lista koncepcji, które stanowią kontekst zapytania. 

Jeśli na etapie przetwarzania pliku nie popełnimy dużych błędów, to ryzyko pominięcia istotnych danych, jest mniejsze, niż w przypadku dzielenia dokumentu na fragmenty. 

![](https://cloud.overment.com/2024-09-08/aidevs3_file-69afa8b1-d.png)

Podsumowując temat transformacji treści: 

- Warto dążyć do pracy z formatami otwartymi, o ile to możliwe. Składnia markdown oraz format JSON (czy YAML) są najbardziej elastyczne, a ich popularność sprawia, że możemy wykorzystać je w połączeniu z zewnętrznymi systemami (np. CMS czy klientami poczty)
- Pracując na zewnętrznych danych, nie musimy z góry zakładać, że trafią do modelu w swojej oryginalnej formie. Fakt, że mamy do dyspozycji duży model językowy sprawia, że możemy je wcześniej przetworzyć. 
- Pomimo dużej elastyczności, jaką oferują duże modele językowe, nadal warto myśleć o możliwym wyspecjalizowaniu rozwiązań i usystematyzowaniu źródeł danych. Choć może się to zmienić w przyszłości, trudno jest wgrać całą bazę wiedzy do promptu systemowego i oczekiwać jakościowych odpowiedzi. W zamian, będzie nam zależało na pracy wyłącznie z tymi danymi, które w danej chwili są niezbędne do wygenerowania odpowiedzi.
## Dedykowane źródła wiedzy dla LLM

Dopasowanie aplikacji do zewnętrznych źródeł danych nie jest jedyną strategią, którą możemy rozważyć. Czasami bardziej uzasadnione będzie zbudowanie bazy wiedzy od podstaw, z myślą o LLM. Nie oznacza to jednak, że całość musi być ręcznie pisana przez człowieka, bo ten może tylko weryfikować treści wygenerowane przez model.

Mowa więc tutaj o sytuacji w której skuteczne przeniesienie zawartości dokumentów do modelu nie będzie możliwe. Wówczas jednorazowo przechodzimy przez proces częściowo automatycznego przetworzenia treści. Gdy dane z którymi pracujemy nie zmieniają się zbyt często, takie podejście może być uzasadnione. 

Alternatywnie, baza wiedzy może być generowana w trakcie interakcji z aplikacją. Jedną z implementacji takiego podejścia jest projekt [mem0](https://github.com/mem0ai/mem0). Jego założeniem jest dynamiczne zapamiętywanie informacji na potrzeby bieżącej interakcji lub zadań realizowanych w przyszłości. Jest to szczególnie wartościowe w przypadku agentów AI, aczkolwiek obecnie trudno jest jeszcze mówić o ich w pełni autonomicznym działaniu. 

W przykładzie [`files`](https://github.com/i-am-alice/3rd-devs/tree/main/files) znajduje się logika asystenta zdolnego do zapamiętywania historii konwersacji oraz kreowania własnych wspomnień. Mechanizm ten jest dość prosty i dla ułatwienia nie korzysta z bazy danych, lecz zapisuje wiedzę w plikach markdown, a do ich przeszukiwania wykorzystuje tzw. 'vector store' o nazwie [faiss](https://github.com/facebookresearch/faiss), który w przyszłości zastąpimy bazą wektorową, np. Qdrant. **UWAGA:** Jeśli nie wiesz nic na temat baz wektorowych, na potrzeby tego przykładu po prostu pomyśl o nich jak o silniku wyszukiwania. 

Przykład rozbudowuje interakcję z modelem o **przeszukanie dostępnej wiedzy** oraz dodanie jej do kontekstu głównego promptu systemowego. Poza tym zawiera także dodatkowy krok, umożliwiający zapisanie bieżącej konwersacji, a także dedykowanych wspomnień. Zatem nie mówimy tutaj o połączeniu z istniejącym już źródłem danych, lecz budowaniem go od podstaw, z myślą o asystencie. 

![](https://cloud.overment.com/2024-09-09/aidevs3_files-07f43abf-b.png)

Działanie przykładu [`files`](https://github.com/i-am-alice/3rd-devs/tree/main/files) widoczne jest na poniższym filmie, lecz zachęcam do jego samodzielnego uruchomienia i porozmawiania z asystentem. Szybko okaże się, że zapisywane wspomnienia są duplikowane, a po zapamiętaniu większej liczby informacji, odzyskanie ich wszystkich nie będzie możliwe. 

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1007617435?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="01_02_learn"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

Powodem problemów z zapisywaniem i odzyskiwaniem informacji, jest sama implementacja, która obecnie nie uwzględnia **aktualizacji wpisów** czy rozbudowanej logiki "przypominania" wcześniejszych wspomnień. 

Wspomnienia asystenta zapisane są w katalogu `context/memories`, który można otworzyć z pomocą aplikacji [Obsidian](https://obsidian.md) w ramach której dostępna jest możliwość wizualizacji z pomocą interaktywnego grafu. Już po wymianie pierwszych wiadomości można wyrobić sobie wstępną intuicję na temat potencjalnych rozwiązań i strategii organizowania informacji. Jest to wartościowe, ponieważ w podobny sposób będziemy budować system umiejętności oraz pamięci długoterminowej dla agentów AI.

![](https://cloud.overment.com/2024-09-09/aidevs3_map-08355b71-e.png)

Wizualizacja w postaci grafu również nie jest tutaj przypadkowa, ponieważ duże modele językowe mogą po nim nawigować, gromadząc informacje na potrzeby rozmowy czy aktualnie realizowanego zadania. Niestety (przynajmniej obecnie) wyzwaniem pozostaje ryzyko duplikowania wpisów oraz generowanie dynamicznej struktury grafu, o czym można poczytać we wpisie "[Constructing Knowledge Graphs From Unstructured Text Using LLMs](https://neo4j.com/developer-blog/construct-knowledge-graphs-unstructured-text/)" na blogu Neo4J. Z tego powodu zwykle będziemy dążyć do poruszania się w ramach z góry ustalonego schematu.
## Zewnętrzne źródła wiedzy

W przykładzie [`websearch`](https://github.com/i-am-alice/3rd-devs/tree/main/websearch) wczytywaliśmy dane z Internetu. Robiliśmy to każdorazowo, więc dane zawsze były aktualne. Jednak gdy do gry wchodzi zestaw danych w postaci dokumentów, bazy produktów czy katalogów, musimy zadbać o ich synchronizację. W związku z tym, zawsze musimy zapisywać **oryginalny identyfikator lub odnośnik do źródła**. Ewentualnie możemy generować własne identyfikatory o ile treści nadal pozostaną poprawnie powiązane. 

Poniżej mamy przykład **połączenia z artykułami publikowanymi na blogu**, których treść ma trafić do modelu. Każdy z wpisów jest dość obszerny i nie może być w całości dołączony do kontekstu promptu systemowego. Co więcej, musimy mieć także możliwość przeszukiwania tych treści. W związku z tym, konieczne jest przetworzenie wpisów oraz zapisanie ich w lokalnej bazie danych i/lub dodanie do indeksu silnika wyszukiwania.

![](https://cloud.overment.com/2024-09-09/aidevs3_index-fcbf4cae-8.png)

Taki system wymaga ustawienia harmonogramu, według którego będą pobierane nowe wpisy, lub webhooków, które będą powiadamiać naszą aplikację o zmianach na blogu.

Aby nie było tutaj wątpliwości, wyjaśnię: 

- Na blogu mamy **cały artykuł** w formie przyjaznej człowiekowi
- Na potrzeby LLM musimy dostosować tę formę, a ta będzie różnić się w zależności od zamierzonego celu. Przykładowo, jeśli budujemy narzędzie tłumaczące treść artykułu, musimy podzielić go na mniejsze fragmenty i przetwarzać je indywidualnie. Powodem jest fakt, że obecnie LLM mają niski limit "output token" i nie są w stanie przepisać treści całego artykułu. 
- Zatem, gdy podzielimy artykuł na mniejsze fragmenty, nadal chcemy zachować informację o ich powiązaniu z oryginałem. I dlatego potrzebny jest nam identyfikator. 

Innym przykładem jest cytowanie źródeł, co przydaje się chociażby w sytuacji, gdy model jest podłączony do Internetu. Poza wypowiedziami, z punktu widzenia użytkownika, wartościowe jest także dołączanie odnośników do stron www, którymi posługuje się model.
## Dostarczanie kontekstu dla modelu

"API modeli jest bezstanowe" — to zdanie wydaje się oczywiste i uzasadnia potrzebę przekazywania do modelu **całej treści konwersacji** za każdym razem. Nie jest to jednak rozwiązanie wszystkich problemów, co widać na poniższym przykładzie.

Mamy tutaj wymianę wiadomości, w której użytkownik pyta, kim jest overment. Wówczas system przeszukuje Internet, wczytując do kontekstu informację, na podstawie której udziela odpowiedzi. Jednak **jeżeli kontekst wyników wyszukiwania zostanie usunięty z konwersacji**, to kolejne pytanie pogłębiające zostanie zaadresowane błędnie.

![](https://cloud.overment.com/2024-09-10/aidevs3_state-e28e27c6-6.png)

Dość szybko nasuwa się na myśl rozwiązanie polegające na tym, aby treść wyników wyszukiwania pozostała w kontekście konwersacji. Jednak w praktyce rzadko jest to możliwe, ponieważ liczba tokenów rośnie bardzo szybko, a model odwraca uwagę od oryginalnych instrukcji. Znacznie lepszym podejściem jest uwzględnienie możliwości ponownego wyszukiwania z mechanizmem pamięci podręcznej, aktywowanej na kilka/kilkanaście minut.

Zatem problem z dostarczaniem wiedzy do kontekstu pojawia się już w związku z jego samą obecnością. Programistycznie musimy zadbać o to, aby wiedza wymagana do udzielenia odpowiedzi była w danej chwili dostępna dla modelu. To jednak nie koniec problemów, ponieważ różne źródła wiedzy będą się ze sobą łączyć i uzupełniać.

Nawet tak niewinne pytanie jak "znajdź w Internecie wszystko, co wiesz na mój temat" przestaje być oczywiste, ponieważ model domyślnie nie wie, co to znaczy "mój temat" i najpierw musi wczytać nasz profil, aby na jego podstawie wygenerować zapytania do wyszukiwarki.

![](https://cloud.overment.com/2024-09-10/aidevs3_loading-df70f143-b.png)

Powyższa sytuacja zdarza się praktycznie na każdym kroku. Poniżej widzimy przykład prostej prośby o włączenie ulubionej muzyki, co rzeczywiście ją uruchamia. Analogicznie moglibyśmy zapytać o muzykę na poprawę humoru, ułatwienie skupienia czy na nocną jazdę samochodem. W każdym z przypadków, schemat jest podobny. 

![](https://cloud.overment.com/2024-09-10/aidevs3_music-df9dde4c-b.png)

Choć z perspektywy użytkownika tego nie widać, w tle wydarzyło się kilka dodatkowych akcji. Przede wszystkim zostały wybrane 2 z kilkudziesięciu akcji, które w tym przypadku mogą się przydać. Poza nazwami, system wygenerował polecenia związane z sposobem ich uruchomienia.

![](https://cloud.overment.com/2024-09-10/aidevs3_skills-3e6453d0-0.png)

Następnie asystent zadał sobie kilka pytań, aby gruntownie przeskanować swoją pamięć w poszukiwaniu informacji o ulubionej muzyce. W tle wydarzyły się jeszcze akcje związane z klasyfikacją tych zapytań, przez co każde z nich dotyczyło różnych obszarów pamięci asystenta. Mówię o nich dlatego, że proces przywoływania wspomnień jest znacznie bardziej rozbudowany niż wypisanie kilku pytań i zresztą przekonamy się o tym w dalszej części kursu. 

![](https://cloud.overment.com/2024-09-10/aidevs3_recall-14eac580-8.png)

Na podstawie zebranych informacji, system podjął decyzję o wykonaniu zapytania do API Spotify, przekazując listę potencjalnych utworów, które mogą mi się spodobać. W rezultacie muzyka została uruchomiona, a system wygenerował potwierdzenie widoczne dla użytkownika. 

![](https://cloud.overment.com/2024-09-10/aidevs3_play-f4035209-1.png)

Przenosząc to na wizualizację, zapytanie wymagające skorzystania z wielu narzędzi w odpowiedniej kolejności, wygląda następująco:

- Zapytanie użytkownika zostaje przeanalizowane w celu ułożenia planu i zadania pytań pogłębiających.
- Dodatkowy kontekst zostaje pobrany automatycznie z bazy danych w wyniku wyszukiwania
- Zebrane informacje zostają przekazane do zewnętrznego API
- W zależności od odpowiedzi API, użytkownik otrzymuje wiadomość potwierdzającą uruchomienie muzyki. W przypadku błędu podejmowane są ponowne próby jej włączenia.

![](https://cloud.overment.com/2024-09-10/aidevs3_schema-67265988-6.png)

Przykład `Spotify` był już omawiany w poprzednich edycjach AI_devs, lecz tam mówiliśmy o dość bezpośrednim skorzystaniu z konkretnego narzędzia. Tutaj natomiast mamy do czynienia z systemem zdolnym do zaplanowania swoich działań, wraz z możliwością zareagowania na nieprzewidziane sytuacje, z którymi zwykle może poradzić sobie samodzielnie. 

Powyższy schemat obrazuje, jak ważne jest kontrolowanie przepływu danych na poszczególnych etapach logiki. Podobnie jak w przypadku funkcji programistycznych, nie zawsze musimy przetwarzać wszystkie dostępne dane, lecz wybierać tylko te, które w danej chwili są nam potrzebne. Tutaj sytuacja jest o tyle bardziej złożona, że musimy okiełznać niedeterministyczną naturę modeli. 
## Podsumowanie

Fizyczne dostarczanie kontekstu do promptu omawialiśmy w lekcji S00E02 — Prompt Engineering. Natomiast teraz widzimy, że kontekst ten, niemal zawsze będzie dostarczany programistycznie i będzie pochodził z różnych źródeł lub był generowany od podstaw przez model. Dlatego warto zadać sobie pytania związane z tym, z jakich danych będziemy korzystać oraz w jaki sposób będziemy je przetwarzać.

Warto zapoznać się z przykładem [`files`](https://github.com/i-am-alice/3rd-devs/tree/main/files), aby zobaczyć to, w jaki sposób dane mogą być wykorzystywane przez model w trakcie interakcji. Równie istotne jest także to, jak model może transformować treści tak, aby móc łatwiej posługiwać się nimi w przyszłości.

Jeśli korzystasz z aplikacji takich jak Todoist, Clickup czy Linear, to spróbuj także odwzorować mechanizm przydzielania nowych zadań do projektów, podobnie jak pokazuje to przykład [`linear`](https://github.com/i-am-alice/3rd-devs/tree/main/linear). Poza przypisaniem zadania do projektu, możliwe jest także uzupełnienie lub wzbogacenie jego opisu, na podstawie wyników wyszukiwania w Internecie czy własnej bazie wiedzy. 

Finalnie, patrząc na przykłady omówione w tej lekcji, można odpowiedzieć sobie na pytanie: **w jaki sposób dostarczenie własnego kontekstu, może pomóc w optymalizacji zadania [...]** (tu wpisz aktywność ze swojej codzienności).