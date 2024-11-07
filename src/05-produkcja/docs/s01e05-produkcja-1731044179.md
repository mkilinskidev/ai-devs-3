---
tags:
  - lesson
---
![](https://cloud.overment.com/2024-11-05/s01e05-e0bd2fa2-4.png)

Nie jest tajemnicą, że budowanie narzędzi na prywatne potrzeby, potrzeby wewnątrzfirmowe czy nawet początkowego etapu [MVP](https://en.wikipedia.org/wiki/Minimum_viable_product) różni się od produkcyjnych aplikacji. Różnica ta jest wyraźna już w klasycznych aplikacjach, które rozwijamy na co dzień. Natomiast generatywne AI to kolejny element, podnoszący poziom trudności.

Na temat limitów generatywnego AI mówiliśmy już całkiem dużo. Poruszaliśmy także możliwe rozwiązania częstych problemów i wciąż poznajemy nowe techniki pracy z modelami, a nawet narzucania na nie naszych własnych ograniczeń. Ostatecznie wiemy też, że niektóre problemy nie mają rozwiązania i mogą być zaadresowane jedynie poprzez **decyzję o tym, aby nie korzystać z modeli językowych** lub poprzez zmianę założeń projektu. 

W tej lekcji porozmawiamy na temat pracy w środowisku produkcyjnym, przechodząc przez proces udostępnienia aplikacji na własnym serwerze. Jest to proces o tyle istotny, że pozwala nam na udostępnienie własnego API, z którym będą mogły kontaktować się zewnętrzne usługi. 

**Ważne:** Jeśli posiadasz duże doświadczenie w pracy na back-endzie, to samodzielnie możesz przejść przez konfigurację własnego API na wybranym VPS. Dodatkowo zwróć uwagę na zagadnienia związane z LangFuse oraz Qdrant.
## Środowisko lokalne i produkcyjne

W związku z tym, że z LLM komunikujemy się poprzez API, samo udostępnienie aplikacji na serwerze produkcyjnym jest dość standardową procedurą. Potrzebujemy VPS (np. [Mikr.us](https://mikr.us/) czy DigitalOcean), domeny, serwera HTTP (np. [nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04)), certyfikatu HTTPS (np. [Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04)), bazy danych (np. SQLite lub PostgreSQL) oraz bazy wektorowej (np. Qdrant). Dodatkowo, w celu optymalizacji procesu deploymentu, możemy zastosować [GitHub Actions](https://github.com/features/actions). Jest to typowy zestaw narzędzi, z którego sam korzystam produkcyjnie.

Aplikacja działająca w środowisku lokalnym/developerskim powinna możliwie najdokładniej odwzorowywać środowisko produkcyjne, uwzględniając w tym wersje narzędzi oraz zależności i strukturę bazy danych — to wszystko powinno być dla każdego jasne.

Różnice w środowisku lokalnym i produkcyjnym pojawiają się jednak w obszarach takich jak: **dane użytkowników**, **połączenia z API (np. tryby "sandbox" bądź oddzielne konta)**, a teraz także same **prompty**. Oznacza to, że w trzech obszarach **powiązanych z przetwarzaniem danych** mogą pojawić się niespójności. 

![](https://cloud.overment.com/2024-09-16/aidevs3_prodlocal-6514d51a-1.png)

Temat danych użytkowników od dawna adresujemy poprzez dane syntetyczne, uzupełniane automatycznie w procesie `seed'owania` bazy. Czasem proces ten jest pomijany lub nie poświęca mu się zbyt dużo uwagi. Gdy dane przetwarzane są przez kod, nie zawsze stanowi to duży problem. Jednak w przypadku modeli językowych jest inaczej. Dlatego należy zadbać o to, aby **dane w lokalnej bazie danych możliwie jak najlepiej odwzorowywały dane produkcyjne** (z uwzględnieniem ich anonimizacji). 

Źródłem danych są także zewnętrzne usługi, z którymi nasza aplikacja komunikuje się poprzez API. Przykładem mogą być narzędzia takie jak CMS, CRM, aplikacje do zarządzania zadaniami, pocztą e-mail czy dokumentami. W środowisku developerskim zwykle korzystamy z oddzielnych kont, na których również mogą znajdować się dane różne od produkcyjnych. Podobnie jak w przypadku baz danych, musimy dbać o to, aby różnice były możliwie jak najmniejsze. Tutaj rozwiązaniem jest **dbanie o odwzorowanie konfiguracji**. Przykładowo jeśli tworzymy narzędzie wspierające zarządzanie zamówieniami w systemie sprzedażowym, to konto testowe musi zawierać dokładnie te same kategorie, które pojawią się na głównym koncie. 

Choć to wszystko brzmi jak coś oczywistego, to z własnego doświadczenia wiem, że mało jest projektów, które adresują te tematy od początku do końca. Z tego powodu zwracam na to uwagę, ponieważ wiąże się z tym dodatkowa praca, która ma znaczne przełożenie na proces rozwoju oprogramowania. 

No i ostatecznie mamy także temat promptów, które stanowią część kodu źródłowego aplikacji, a ich modyfikacja w sposób nieoczywisty może wpłynąć na stabilność całego systemu. Wiemy już, że dzięki PromptFoo oraz LangFuse możemy rozwijać prompty w bardziej kontrolowany sposób, co staje się krytyczne, szczególnie podczas pracy w zespole. Jednak pojawia się tutaj także potrzeba rozwijania bazy zestawów danych testowych, zarządzanie wersjami promptów, wersjami samych modeli oraz związanymi z nimi kosztów. 

W lekcji S01E03 — Limity mówiliśmy o limitach API platform udostępniających duże modele językowe. Nie wspomniałem tam jednak o roli limitów działających po stronie naszych aplikacji. O ich znaczeniu przekonaliśmy się sami, gdy jeden z naszych projektów został odpytany 500 000 razy. Dzięki mechanizmom [Cloudflare](https://www.cloudflare.com/) straty poniesione podczas tego ataku, **wyniosły ~20 groszy**. Bez tego mówilibyśmy raczej o kilku, kilkunastu tysiącach złotych. 

O wszystkim, co właśnie powiedziałem, najlepiej przekonać się w praktyce. Dlatego przejdziemy teraz przez dwa scenariusze, które pozwolą nam na publiczne udostępnienie naszego API w dwóch wariantach — aplikacji hostowanej na naszym komputerze oraz wirtualnym serwerze prywatnym (VPS). Pierwszą z tych opcji trudno jest nazwać produkcyjną, lecz może sprawdzić się na własne potrzeby, szczególnie dla osób nieposiadających doświadczenia w pracy na back-endzie i obsłudze serwerów.
## Localhost dostępny w Internecie

W przykładzie `external` znajduje się prosta aplikacja umożliwiająca rozmowę z dużym modelem językowym, ale zawiera kilka dodatkowych detali, które do tej pory pomijaliśmy. 

Przede wszystkim, w pliku `middlewares.ts` znajduje się funkcja `limiter` odpowiadająca za nakładanie limitów liczby zapytań. Po przekroczeniu **jednego zapytania na 10 sekund**, aplikacja zacznie zwracać poniższy błąd. Jest to prosta implementacja limitów, która docelowo powinna albo być zrealizowana przez Cloudflare, albo przez rozbudowany mechanizm uwierzytelnienia połączenia z danym użytkownikiem. 
 
![](https://cloud.overment.com/2024-09-16/aidevs3_429-7b2386c4-e.png)

Dodatkowo dostęp do aplikacji jest zablokowany dla połączeń, które nie zawierają nagłówka `Authorization` ustawionego na wartość z pliku `.env` przypisaną do klucza `PERSONAL_API_KEY`. Inaczej mówiąc, nikt z zewnątrz nie będzie mógł skorzystać z naszej aplikacji.

![](https://cloud.overment.com/2024-09-16/aidevs_401-de209274-6.png)

Po uruchomieniu serwera poleceniem `bun external`, możemy skorzystać z narzędzi takich jak ngrok (bezpłatna wersja), [localcan](https://www.localcan.com/) (bezpłatny 7-dniowy trial) lub samodzielnej konfiguracji przekierowania. W przypadku tego pierwszego, udostępnienie aplikacji polega na uruchomieniu prostego polecenia `ngrok http localhost:3000`, a następnie przejścia na adresu z wiersza `Forwarding`. Oczywiście w przypadku bezpłatnego planu adres ten będzie generowany na nowo po każdym uruchomieniu, więc warto rozważyć wykupienie płatnego planu. 

![](https://cloud.overment.com/2024-09-16/aidevs3_ngrok-5e61f19c-e.png)

## Konfiguracja VPS

**WAŻNE:** Konfiguracja własnego serwera **nie jest wymagana w AI_devs 3**, ale poruszamy ten temat, ponieważ bardzo przydatne jest posiadanie zdalnego dostępu do narzędzi, które projektujemy. Możesz więc pominąć ten krok i opierać się na wspomnianym wyżej `ngrok`.

Na początku dzisiejszej lekcji linkowałem wpisy do poradników z DigitalOcean na temat konfiguracji serwera. Mowa konkretnie o:

- [Konfiguracja Nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04)
- [Konfiguracja Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04)
- [Konfiguracja Node.js](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04)
- [Konfiguracja PostgreSQL (opcjonalnie)](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-20-04)

Sam korzystam z powyższych wpisów przy ustawianiu własnych serwerów na potrzeby developmentu. W przypadku produkcji korzystam ze wsparcia osób specjalizujących się w tym obszarze lub zajmują się tym inne osoby z zespołu.

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1010135935?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="01_05_vps"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

Podsumowując konfigurację przedstawioną na filmie: 

1. **Dostęp VPS:** Wykup dostęp do serwera VPS: DigitalOcean lub Mikr.us
2. **Nowy serwer:** Utwórz nowy droplet (digitalocean) działający na Ubuntu, z minimum 2GB RAM (rekomendowane 4GB). Do autoryzacji wykorzystaj klucz SSH (możesz wygenerować go poleceniem `ssh-keygen`), a następnie skopiuj treść klucza publicznego z pliku z końcówką `.pub`.
4. **Połączenie:** Połącz się z serwerem korzystając z polecenia ` ssh root@adres_ip_serwera -i ~/.ssh/nazwa_klucza_prywatnego`
5. **Nginx:** Zainstaluj `nginx`
6. **Server Block:** Utwórz server block w `/etc/nginx/sites-available` powiązany z Twoją domeną lub subdomeną
7. **Aktywacja Server Block:** Aktywuj server block poleceniem `sudo ln -s /etc/nginx/sites-available/your_domain /etc/nginx/sites-enabled/`, sprawdź konfigurację nginx `nginx -t` i jeśli się wszystko zgadza przeładuj ją poleceniem `sudo service nginx reload`. 
8. **Konfiguracja domeny:** Dodaj rekord A Twojej domeny, ustawiając go na adres IP serwera
9. **Let's Encrypt:** Zainstaluj `certbot` i wygeneruj certyfikat let's encrypt dla Twojej domeny
10. **Node.js:** Zainstaluj najnowszą wersję node.js i bun
11. **Serwer Node.js:** Pobierz [ten przykładowy kod](https://cloud.overment.com/aidevs3_vps-1726560176.zip) i umieść go na serwerze. Następnie uzupełnij plik `.env` swoim kluczem API oraz dowolnym ciągiem znaków dla klucza `PERSONAL_API_KEY`
12. **Zainstaluj pm2:** `npm install pm2@latest -g` i uruchom serwer Node.js poleceniem `pm2 start bun -- start`
13. Wyślij zapytanie do serwera: 

> curl --request POST \
  --url https://twojadomena.com/api/chat \
  --header 'Authorization: Bearer PERSONAL API KEY' \
  --header 'Content-Type: application/json' \
  --data '{
	"messages": [
		{
			"content": "hey",
			"role": "user"
		}
	]
}'

W dalszej części AI_devs 3, posiadanie własnego serwera na którym działa aplikacja udostępniająca nasze prywatne API, może okazać się bardzo przydatne. Choć nie jest to wymagane do dalszej nauki, to z pewnością dobrym pomysłem jest stworzenie własnego "produkcyjnego" środowiska pracy. 

## Zarządzanie promptami

Do tej pory treść promptów przechowywaliśmy w kodzie aplikacji. W przypadku prostych instrukcji oraz etapu prototypu, może to być wystarczające. Szybko jednak można przekonać się o tym, że wprowadzanie nawet najmniejszych zmian, szczególnie w zespole, staje się sporym wyzwaniem. Co więcej, przykład `memory` omawiany w poprzedniej lekcji dość dobrze obrazuje trudność w monitorowaniu kolejnych wersji promptów. Jednocześnie LangFuse (i podobne narzędzia, takie jak chociażby [Agenta.ai](https://agenta.ai/)) dają możliwość zarządzania promptami i ich wersjonowaniem. 

W przykładzie `prompts` w pliku `AssistantService` znajduje się metoda `answer`, która w przeciwieństwie do tego, co robiliśmy wcześniej, nie wczytuje promptu z pliku, lecz pobiera go bezpośrednio z LangFuse. 

![](https://cloud.overment.com/2024-09-17/aidevs3_prompts-eb680ed8-7.png)

Sam prompt został zdefiniowany w panelu, w zakładce "Prompts". Możemy w nim definiować zmienne, które podczas wczytywania lub kompilacji instrukcji są zastępowane docelowymi wartościami. Po wprowadzeniu zmian zapisywana jest nowa wersja, do której możemy przypisać własne etykiety.

**UWAGA:** Aby uruchomić przykład, oczywiście należy samodzielnie dodać do LangFuse prompt o nazwie "Answer" i nawet prostej treści "As Alice, you're speaking to ...". 

![](https://cloud.overment.com/2024-09-17/aidevs3_manageprompts-262c6fdf-4.png)

Zarządzanie promptami po stronie LangFuse ma jedną definitywną przewagę — monitorowanie. Każda z zapisanych instrukcji może być połączona z interakcją użytkowników, co ułatwia późniejsze przeglądanie zarówno aktywności z perspektywy sesji, użytkownika, jak i samego promptu. Co więcej, prompt może zostać automatycznie zweryfikowany dzięki funkcjonalności 'Evaluation', w której możemy skonfigurować testy.

![](https://cloud.overment.com/2024-09-17/aidevs3_track-1799b624-e.png)

Automatyczna ewaluacja dostarcza informacji na temat jakości odpowiedzi generowanych przez model, poprzez ocenę oraz krótki komentarz. 

![](https://cloud.overment.com/2024-09-17/aidevs3_evaluate-5e2513c4-7.png)

Ostatnią rzeczą, na którą warto zwrócić uwagę na tym etapie, jest uwzględnienie **identyfikatorów użytkownika** i powiązanie ich z logami LangFuse. Pozwala to na przegląd jego interakcji, ewentualne debugowanie, a także wgląd w ogólne statystyki.

![](https://cloud.overment.com/2024-09-17/aidevs3_user-18d2f73c-9.png)

Dopasowanie monitorowania do własnej aplikacji, będzie różnić się w zależności od przypadku. Zdecydowanie dobrym pomysłem jest zapoznanie się z interaktywnym demo, dostępnym [w dokumentacji Langfuse](https://langfuse.com/docs/demo). 

![](https://cloud.overment.com/2024-09-17/aidevs3_demo-527a2980-a.png)

Jeśli chodzi o dalsze konfiguracje, to w kolejnych przykładach będziemy dążyć do pełnego monitorowania (z pewnymi wyjątkami). Kluczowe będzie wyrobienie nawyku domyślnego korzystania z narzędzi do monitorowania (nie musi to być Langfuse).
## Baza danych

Kolejnym elementem produkcyjnej aplikacji jest baza danych. W tym obszarze obecność dużych modeli językowych raczej nie wprowadza zbyt dużych zmian, w porównaniu do klasycznych aplikacji. Z pewnością będziemy chcieli zapisywać w niej **historię interakcji z modelem**, **dane na potrzeby RAG**, a niekiedy także dynamiczne elementy promptów, takie jak chociażby **instrukcje obsługi narzędzi agentów**. 

Pomiędzy produkcyjną a lokalną bazą danych musi być utrzymana spójność struktury. Zapewnia to proces `migracji`, w ramach którego opisujemy sposób organizacji danych oraz zmiany, które będą zachodziły wraz z rozwojem aplikacji. Natomiast same informacje przechowywane w bazie, będą się różnić w zależności od środowiska. Tutaj dzięki wspomnianemu procesowi `seedowania`, będziemy mogli wypełniać bazę przykładowymi danymi. Zarówno proces `migracji` jak i `seed'owania` leży po stronie osób zajmujących się rozwojem back-endu, zatem jeśli pracujesz na front-endzie to zapamiętaj tylko, aby **baza produkcyjna i lokalna posiadały taką samą strukturę i możliwie zbliżoną zawartość, ale nigdy nie mogą być ze sobą bezpośrednio połączone**.

Aby doświadczyć pracy z bazami danych w praktyce, w przykładzie `database` uwzględniam integrację z SQLite dzięki [Drizzle ORM](https://orm.drizzle.team). Nie potrzebujemy więc instalacji serwera, którego wymaga chociażby PostgreSQL, a cała baza danych zostanie zapisana w pliku `database.db`, który po uruchomieniu przykładu, pojawi się w jego katalogu. 

Po przesłaniu zapytania do aplikacji na endpoint `/api/chat`, zostanie uruchomiony fragment kodu odpowiedzialny za dodanie nowego wpisu do tabeli `messages`, którego treść będziemy mogli w przyszłości odczytać. 

![](https://cloud.overment.com/2024-09-17/aidevs3_entry-5c6e7fa3-3.png)

Dane przechowywane w bazie możemy łatwo przeglądać z pomocą graficznych interfejsów, takich jak chociażby [TablePlus](https://tableplus.com/) lub dowolnej alternatywy obsługującej SQLite. Po uruchomieniu pliku `database.db`, wewnątrz tabeli `messages` znajdziemy historię interakcji z modelem.

![](https://cloud.overment.com/2024-09-17/aidevs3_db-8cf06ee2-9.png)

Jeśli bazy danych stanowią dla Ciebie nowe zagadnienie, to koniecznie uruchom przykład `database` i przyjrzyj się temu, jak zapisywane są informacje w pliku `DatabaseService.ts` oraz jak budowana jest struktura tabeli. Tutaj bardzo pomocna jest wiedza na temat języka SQL (którego podstawy można opanować bardzo szybko i tutaj może pomóc nam także LLM). Szybko przekonasz się, że bazy danych to w uproszczeniu tabele, w których organizujemy dane aplikacji, a następnie odczytujemy i zapisujemy je z pomocą kodu.

Od tej pory w większości przykładów będziemy wykorzystywać SQLite na potrzeby przechowywania danych. Z powodzeniem możesz także pracować z nim na potrzeby prywatnych projektów.
## Silniki wyszukiwania

W lekcji S01E04 — Techniki optymalizacji przeszliśmy przez mały wstęp na temat baz wektorowych, stosując vector store `faiss`. Jednak w praktyce będziemy sięgać po znacznie bardziej rozbudowane narzędzia, takie jak Qdrant, który jest dostępny zarówno na świetnym planie bezpłatnym oraz w wersji Open Source.

Techniki pracy z bazą wektorową będziemy omawiać jeszcze w dalszej części AI_devs. Tymczasem w przykładzie `qdrant` znajduje się bardzo prosta implementacja, zapisująca historię rozmów oraz wczytująca je do kontekstu. Mechanizm ten nie jest szczególnie użyteczny, lecz kluczowe jest samo podłączenie z Qdrant. 

Przed uruchomieniem przykładu, załóż bezpłatne konto w Qdrant Cloud i pobierz adres URL bazy oraz klucz API i dodaj je do pliku `.env`. Następnie po przesłaniu pierwszego zapytania na endpoint `/api/chat`, zostanie zainicjalizowana kolekcja, a wewnątrz niej pojawią się pierwsze punkty (czyli wpisy). 

![](https://cloud.overment.com/2024-09-17/aidevs3_collection-4c3aa233-1.png)

Jeśli wszystko zostało odpowiednio podłączone, to model będzie w stanie odpowiadać na pytania, posługując się top-10 najbardziej istotnych wiadomości. Natomiast z produkcyjnego punktu widzenia, jest tutaj kilka istotnych detali:

- Dane w bazie wektorowej przechowywane są w formie embeddingu oraz powiązanych z nimi metadanych. Embedding generowany jest przez model (w naszym przypadku `text-embedding-3-large`) i jest to pierwszy problem, z którym należy się liczyć, ponieważ wybranego modelu nie można zastąpić innym bez **ponownego indeksowania całej bazy**. W przypadku bardzo dużych baz danych może okazać się to dość kosztowne.
- Embedding, jak wiemy, opisuje znaczenie treści w formie liczb. Jednak modele, które go generują mają różną skuteczność w zależności od języka (np. polski / angielski), co również rodzi problemy z punktu widzenia rozwoju aplikacji.
- Wyszukiwanie z pomocą bazy wektorowej jest już powszechnie uznawane za niewystarczające (choć bardzo wartościowe). Oznacza to, że w architekturze aplikacji musimy uwzględnić także inne silniki wyszukiwania oraz strategie organizacji treści.
- W praktyce będzie nam zależało na tym, aby **te same dane opisywać na różne sposoby** w celu zwiększenia skuteczności procesu wyszukiwania. Np. poza oryginalną treścią opisu produktu, może nam zależeć na indeksowaniu także jego pojedynczych cech. Takie przetwarzanie utrudnia aktualizowanie, synchronizację oraz późniejsze przeszukiwanie bazy danych.
- Baza wektorowa nie zastępuje nam klasycznej bazy danych, a więc informacje pomiędzy nimi muszą być synchronizowane. Rodzi to ryzyko rozwarstwienia danych, co również musimy uwzględnić na etapie developmentu.
- Wiemy, że skuteczność wypowiedzi LLM zależy od jakości promptu oraz zawartego w nim kontekstu. Skoro kontekst ten budowany jest dynamicznie na podstawie wyników wyszukiwania, to tutaj również będzie zależało nam na ewaluacji obejmującej monitorowanie skuteczności całego procesu.

Zatem, baza wektorowa to dodatkowy komponent aplikacji, który pod kątem złożoności można zestawić z każdym innym silnikiem wyszukiwania. Natomiast tutaj dodatkowa trudność polega na nowych technikach pracy z indeksowaniem oraz przeszukiwaniem treści, o czym będziemy mogli się jeszcze przekonać. 
## Dynamika zmian i nowe wersje modeli

W sieci dużo mówi się na temat szybkiego rozwoju LLM oraz związanych z tym problemów z migracją na nowsze wersje. W rzeczywistości trudność związana z przełączaniem na najnowsze modele zwykle jest mniejsza niż mogłoby się wydawać, ponieważ charakteryzują się one znacznie lepszą skutecznością. Tym bardziej, że dysponując narzędziami do automatycznej ewaluacji promptów, możemy sprawdzić działanie nowych modeli dla naszego kontekstu.

Zatem zawsze, gdy pojawia się nowy model, warto brać pod uwagę chociażby jego pozycję w benchmarkach (np. [LMSYS](https://lmsys.org/blog/2023-05-03-arena/) czy [LiveBench](https://livebench.ai/)), ale ostateczną decyzję o jego wyborze, należy podjąć po przeprowadzeniu własnych testów. 

W lekcji S00E04 — Programowanie pisałem na temat budowania warstwy abstrakcji, dzięki której możliwe jest skorzystanie z modeli różnych dostawców. Świetną opcją jest także praca z chociażby Vercel AI SDK czy podobnymi narzędziami, które ułatwiają pracę z wieloma modelami.

Przez większość AI_devs 3, nasza uwaga będzie skupiona na modelach SOTA. Jednak trzeba pamiętać także o modelach Open Source, zwłaszcza tych zdolnych do działania na urządzeniach mobilnych. Przykłady modeli takich jak te z rodziny Phi czy Qwen oraz ogólny kierunek Apple Intelligence pokazują, że małe modele językowe mogą odegrać jeszcze istotną rolę w obszarze generatywnego AI.

Ostatecznie w kwestii dynamiki zmian, jako największe ograniczenia można wskazać: 

- Pozostawanie na bieżąco zarówno z modelami, narzędziami, jak i technikami pracy z nimi. Tutaj bardzo może pomóc podążanie za sugestiami z lekcji S00E05 — Rozwój.
- Architektura aplikacji i decyzje projektowe uzależniające nas od wybranego zestawu narzędzi. Tutaj dużo na ten temat mówiliśmy w lekcji S00E04 — Programowanie, a wątki związane z zachowaniem elastyczności, pojawiają się praktycznie na każdym kroku.
- Wątki biznesowe oraz prawne również mogą stanowić bardzo poważne ograniczenie z perspektywy rozwoju aplikacji. Przykładem może być scenariusz w którym organizacja przeszła przez proces umożliwiający dostęp do modeli OpenAI, ale nie ma dostępu do modeli Anthropic, które nierzadko okazują się znacznie lepsze.

Pomimo wszystko, temat zachowania wysokiej dynamiki rozwoju aplikacji, to w największym stopniu problem dotyczący technologii, powiązany z kulturą produktową obecnej w firmie oraz nastawienia do rozwoju poszczególnych osób z zespołu. Warto więc podejmować inicjatywy mające na celu wymianę wiedzy wewnątrz organizacji i/lub grup projektowych.

## Podsumowanie

Poza wymienionymi wątkami dotyczącymi rozwoju aplikacji od strony technologii, zastosowanie generatywnego AI nie jest uzależnione wyłącznie od kwestii technicznych. Możliwości modeli językowych wzbudzają skrajne emocje, od tych najbardziej pozytywnych, do skrajnie negatywnych. W obu przypadkach wartość, którą otrzymujemy z zastosowania tej technologii jest niska, bo albo próbujemy stosować ją tam, gdzie zwyczajnie się nie sprawdza, albo korzystamy z jej możliwości w ogóle. Warto się nad tym zastanowić.

Tymczasem jedna rzecz z tej lekcji, której warto poświęcić czas polega na skonfigurowaniu swojego prywatnego API z pomocą wybranego języka programowania i dowolnych narzędzi — własny serwer, VPS czy serverless. Moment w którym duży model językowy stanie się dla nas dostępny wszędzie, a my będziemy mieć możliwość dopasowania jego zachowania do siebie, jest początkiem ścieżki AI_devs 3.