---
tags:
  - lesson
---
![](https://cloud.overment.com/S01E04-1730930695.png)

Optymalizacja kodu aplikacji jest ważna, ale często pomijana, ponieważ w małych projektach zazwyczaj nie odgrywa kluczowej roli. W przypadku promptów jest nieco inaczej, ponieważ tutaj nawet proste zadania mogą być błędnie wykonane w wyniku braku precyzji. Co ciekawe, mowa tutaj nie tylko o precyzji samego promptu, ale także logiki zapisanej w kodzie.

W przykładzie `files` omawianym w lekcji S01E02 — Kontekst stworzyliśmy poniekąd imponujący mechanizm dynamicznego budowania pamięci. Wystarczy jednak kilka zapytań, aby przekonać się, że brakuje w nim wielu funkcjonalności, a użyteczność samego narzędzia jest dość ograniczona. Dlatego w tej lekcji, przesuniemy nieco granicę tego, co jest możliwe, omawiając przykład `memory`, który tylko pozornie realizuje podobne zadanie, co przykład `files`.

W lekcji S00E04 — Programowanie pisałem, że prompty w kodzie aplikacji niemal zawsze składają się z kilku dynamicznych sekcji, co utrudnia ich podgląd i debugowanie. Dlatego przeszliśmy też przez konfigurację LangFuse, po które teraz także sięgniemy. Poza nim, praktyczne zastosowanie znajdzie także PromptFoo (lub alternatywne narzędzie do ewaluacji promptów). 

O Prompt Engineeringu można pisać dużo teorii. Techniki takie jak Few-Shot, Chain of Thought czy Tree of Thoughts warto znać także od tej strony, ale na pewnym etapie i tak zderzymy się z koniecznością praktycznego zastosowania tej wiedzy. Same techniki nie są jednak wszystkim, ponieważ najwięcej pracy i tak będzie kosztować nas staranne opisanie instrukcji oraz dostarczenie jakościowych przykładów. Jeszcze jakiś czas temu cała ta praca musiałaby być wykonana bezpośrednio przez nas, jednak od teraz chciałbym, aby praktycznie **w każdej sytuacji towarzyszył nam duży model językowy**, a nasza rola przechodziła bardziej w rolę architekta czy architektki.

To, o czym teraz piszę, ma swoje uzasadnienie w publikacjach takich jak [Large Language Models as Optimizers](https://arxiv.org/abs/2309.03409) oraz [Large Language Models Are Human-Level Prompt Engineers](https://arxiv.org/abs/2309.03409), a także wynika bezpośrednio z mojego doświadczenia. Choć trudno jest obecnie mówić o tym, że proste zapytanie do modelu (Completion) jest w stanie wygenerować bezbłędny rezultat, nawet w przypadku modeli o1, to bez wątpienia są one w stanie skutecznie nas wspierać. Może to odbywać się albo w bezpośredniej interakcji, albo przez częściowo autonomiczne narzędzia, które zresztą będziemy jeszcze budować.

Poniżej mamy fragment wspomnianej publikacji, prezentujący koncepcję Meta Promptu, z pomocą którego możemy optymalizować inne prompty. 

![](https://cloud.overment.com/2024-09-14/aidevs3_llm_optimizers-7a40ff51-b.png)

Na podobnej zasadzie możemy debugować istniejące prompty, generować przykłady Few-Shot czy zestawy testowe na potrzeby ewaluacji. 

To wszystko nie zastępuje jednak naszego własnego umysłu, który jest nadal niezbędny do nadawania kierunku, ustalania ścieżek czy narzucania ograniczeń. Dlatego zacznijmy od ogólnej koncepcji przedstawionej w przykładzie `memory` oraz tym, on w zasadzie działa. 

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1009451739?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="01_04_memory"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

Logika przykładu `memory` układa się następująco: 

1. Na podstawie treści konwersacji, asystent zadaje sobie serię pytań, które są zostają wykorzystane w celu przeszukania pamięci. Ważne jest to, że **zapytania te, nie są generowane wyłącznie na podstawie ostatniej wiadomości**, co pozwala na utrzymanie kontekstu. Np. jeśli rozmowa prowadzona jest na temat "Dużych Modeli Językowych", to asystent wielokrotnie będzie wczytywał sobie informacje na ich temat. Stwarza to nam przestrzeń do optymalizacji, chociażby poprzez wprowadzenie pamięci tymczasowej, przez co te same wspomnienia nie będą musiały być wczytywane za każdym razem.
2. Następnie z pomocą Vector Store odnajdywane są wspomnienia pasujące do wyżej wygenerowanych zapytań. Na tym etapie są one także filtrowane, ale i tak docelowo moglibyśmy analizować je z pomocą modelu, aby upewnić się, że do głównego kontekstu trafią faktycznie tylko te, które są istotne w danym momencie konwersacji.
3. Po wczytaniu wspomnień, asystent decyduje o tym, czy powinien się czegoś nauczyć. Pod uwagę brane są tutaj wszystkie posiadane informacje oraz przede wszystkim **polecenie użytkownika**, który musi wyraźnie podkreślić chęć zapisania danych. Domyślnie może dojść tutaj do pomyłki, ze względu na to, że odpowiedzialność leży po stronie modelu. Możliwe jest jednak z modyfikowanie logiki aplikacji tak, aby użytkownik mógł np. z pomocą interfejsu potwierdzić zapisanie wspomnienia.
4. W przypadku, gdy istnieje potrzeba zapamiętania informacji, asystent bierze pod uwagę wspomnienia wczytane w punkcie `2` i podejmuje decyzję o dodaniu/aktualizacji/usunięciu danych. Tutaj warto zaznaczyć, że skuteczność organizacji będzie zależeć od skuteczności odnajdywanych informacji.
5. No i ostatecznie zgromadzone dane trafiają do głównego promptu, który generuje odpowiedź przekazywaną do użytkownika. 

Cały schemat interakcji prezentuje się następująco (poniższą grafikę można otworzyć w nowej karcie, aby była bardziej czytelna).

![](https://cloud.overment.com/2024-09-14/aidevs3_memory_map-f6f865e6-0.png)

## Kilka słów o embeddingu i vector store

Jeśli pracujesz już z bazami wektorowymi, możesz pominąć ten akapit.

Dotychczas w przykładach pojawiał się temat vector store lub baz wektorowych oraz embeddingu. Choć będziemy o nim jeszcze mówić, to już teraz zrobimy małe wprowadzenie. Sam temat baz wektorowych można zrozumieć znacznie lepiej, gdy nazwiemy je po prostu **silnikami wyszukiwania**, podobnymi do ElasticSearch czy Algolia. Jednak tutaj zamiast szukać dopasowanych sposobem zapisu, szukamy fraz podobnych pod kątem znaczenia. Np. podobny zapis to `król`, `królowa` a podobne znaczenie to `król` i `mężczyzna` oraz `królowa` i `kobieta`.

Znaczenie słów opisuje się z pomocą modeli generujących tzw. embedding, czyli zestaw liczb (wektorów) reprezentujących różne cechy treści. W naszych przykładach korzystamy z modelu `text-embedding-3-large` od OpenAI, jednak już teraz jest istnieją znacznie lepsze modele, wymienione na [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard). W zależności od zastosowania (np. pracy z językiem polskim) mogą sprawdzić się inne modele. Co więcej, w przypadku nowych słów (np. projektu Tech•sistence), model może mieć trudność w opisaniu ich znaczenia i trzeba o tym pamiętać oraz stosować wyszukiwanie hybrydowe. 

![](https://cloud.overment.com/2024-09-14/aidevs3_meaning-8c93c129-0.png)

W każdym razie, aby wyszukiwanie z pomocą embeddingu było możliwe, w pierwszej kolejności wpisy z naszej bazy muszą zostać zamienione na embedding i przechowane w bazie wektorowej lub klasycznej bazie dostosowanej do obsługi takiego formatu danych. 

Następnie, aby wyszukać informacje, musimy zamienić wyszukiwanie na embedding. Tylko wtedy możemy porównać jego znaczenie z danymi przechowywanymi w bazie wektorowej i pobrać te o najbliższym podobieństwie znaczeniowym. Mechanizm ten widać wyraźnie poniżej. Zapytanie "Play Music" zostało zamienione na embedding `[0.2, ...]`, a najbardziej zbliżona do niego jest informacja o Spotify (`[0.3, ...]`). 

![](https://cloud.overment.com/2024-09-15/aidevs3_vector-c536e191-2.png)

No i przenosząc to na przykład `memory`, z treści konwersacji LLM generuje zapytania, które zamieniamy na embedding, a następnie przeszukujemy vector store "`faiss`". Wewnątrz niego przechowujemy wyłącznie identyfikatory plików (`uuid`), dzięki którym możemy wczytać faktyczną treść plików.
## Generowanie promptów

W przykładzie `memory` w pliku `prompts.ts` znajduje się kilka rozbudowanych promptów. Każdy z nich na tym etapie można uznać za szkic lub po prostu pierwszą wersję zdolną do realizowania początkowych założeń z pomocą modelu GPT-4o. Prompty napisałem z pomocą LLM oraz specjalnego meta promptu podobnego do tego, który udostępniałem w lekcji S00E02 — Prompt Engineering. Natomiast teraz, przyjrzymy się temu nieco bliżej.

Na początek trzeba zaznaczyć, że obecnie duże modele językowe posiadają już wiedzę na temat popularnych technik projektowania promptów. Co więcej, potrafią wykorzystać ją w praktyce oraz łączyć z bogatym słownictwem i rozległą wiedzą na różne tematy. Jakiś czas temu pojawił się nawet przeciek jednego z promptów stosowanych przez Apple, który zawierał fragment "don't hallucinate". Został on dość szeroko skomentowany, głównie negatywnie, aczkolwiek pojawiły się także wypowiedzi o tym, że [może być w tym sens.](https://x.com/benhylak/status/1820894401834741912).

![Duże modele językowe mają już wiedzę o projektowaniu promptów, np. CoT](https://cloud.overment.com/2024-09-14/aidevs3_cot-5887cbb9-4.png)

Wracając do meta promptu, możesz pobrać go [tutaj](https://cloud.overment.com/AI_devs-3-Prompt-Engineer-1726336422-1726339115.md). W związku z tym, że jest on dostosowany do moich potrzeb, omówimy teraz jego poszczególne fragmenty. 

W pierwszej części standardowo nadajemy rolę (Prompt Engineer) i zawężamy kontekst, wspominając o "Large Language Models", dzięki czemu nie ma tutaj mowy o dwuznaczności tematu. Zaraz po tym, znajduje się sekcja `<objective>` określająca główne przeznaczenie promptu. Jej położenie nie jest przypadkowe, ponieważ LLM mają tendencję do przykładania większej uwagi do instrukcji znajdujących się na początku i końcu promptu, co zostało opisane w [Lost in The Middle](https://arxiv.org/pdf/2307.03172). Choć od czasu publikacji tego dokumentu minęło już trochę czasu, a modele wykazują znacznie lepsze umiejętności przetwarzania kontekstu, to problem nadal występuje, o czym możemy przeczytać także w [A Challenge to Long-Context LLMs and RAG Systems](https://arxiv.org/pdf/2407.01370).

Po określeniu celu, mamy jeszcze sekcję zasad, czyli `<rules>` w której znajdują się precyzyjne wytyczne dotyczące sposobu generowania treści i prowadzenia interakcji. Obecnie nie wiadomo zbyt wiele na temat skuteczności pisania WIELKIMI literami wybranych słów kluczowych, ale można uznać je za istotne z punktu widzenia czytelności instrukcji. 

Wśród zasad padają także określenia takie jak Chain of Thought czy zasady SMART, których celem jest aktywowanie obszarów modelu, powiązanych właśnie z tymi koncepcjami, o czym mówiliśmy przy okazji tematu `Latent Space`. 

![](https://cloud.overment.com/2024-09-14/aidevs3_meta_1-b4834a43-7.png)

Kolejnym fragmentem promptu jest seria kroków czy też elementów procesu kształtowania promptu, które spisałem na podstawie swoich własnych doświadczeń. Ich obecność w meta prompcie jest po to, aby model prowadził mnie przez niego za każdym razem gdy pracujemy nad nową instrukcją. Oczywiście część z tych kroków może być pominięta w trakcie rozmowy, lecz zwykle warto się przy nich na trochę zatrzymać, aby upewnić się, że wyraźnie podkreślamy wszystkie istotne punkty nowego promptu. 

![](https://cloud.overment.com/2024-09-14/aidevs3_meta_2-035a2fca-d.png)

W dalszej części mamy zestaw słów kluczowych oraz technik, których celem jest zwrócenie uwagi modelu na wybrane obszary wiedzy, takie jak zastosowanie popularnych modeli mentalnych czy unikanie błędów poznawczych. Umieszczenie ich wewnątrz meta promptu zwiększa szansę, że zostaną one wykorzystane podczas rozmowy na temat kształtowania czy optymalizacji nowych instrukcji.

![](https://cloud.overment.com/2024-09-14/aidevs3_meta_3-acf500bc-2.png)

No i ostatecznie mamy także ogólny szablon promptu, uwzględniający różne sekcje oraz szkicujący sposób prezentowania przykładów Few-Shot. Na uwagę zasługuje początek i koniec tej sekcji, ponieważ zastosowałem tu **inny separator w postaci ### oraz wielkich liter**. Powodem jest fakt, że nie mogłem już skorzystać z tagów takich jak `<objective>`, ponieważ korzystam z nich już w samym meta prompcie oraz prezentowanym szablonie. Inny separator pozwala na **odróżnienie** treści. 

![](https://cloud.overment.com/2024-09-14/aidevs3_meta_4-3c82b7ad-c.png)

Raz jeszcze, link do powyższego promptu znajduje się [tutaj](https://cloud.overment.com/AI_devs-3-Prompt-Engineer-1726336422-1726339115.md). Samo korzystanie z niego polega po prostu na ustawieniu go jako wiadomość systemowa, a następnie zarysowaniu celu nowego promptu, który chcemy stworzyć. Wówczas model poprowadzi nas przez cały proces, krok po kroku.

Powyższy meta prompt pełni niezwykle istotną rolę i nie chodzi w niej o szybsze generowanie nowych promptów, lecz **staranne iterowanie wspólnie z modelem kolejnych wersji instrukcji** oraz **dostrzeganie detali i zależności**, które nierzadko trudno jest nam zauważyć. Mówi się też, że duże modele językowe nie są kreatywne i jedynie odtwarzają treści z danych treningowych. Wystarczy jednak zbudować wspólnie z nimi kilka promptów, aby przekonać się, że potrafią nas zaskoczyć i myślę, że już niebawem będziemy to obserwować. 

**WAŻNE:** Celem meta prompt **nie jest** generowanie promptu dla nas, lecz wspólnie z nami. Cały czas główna część pracy leży po naszej stronie. 
## Debugowanie promptu

Gdy czytasz te słowa, przykład `memory` znajduje się na etapie w którym realizuje podstawowe założenia związane z organizacją informacji. Zatem po stronie mechaniki, wszystko wygląda w porządku, jednak nie wiem jeszcze jak wypadnie w praktyce. Wystarczyło jednak przesłanie kilku linków, aby zobaczyć, że prompt odpowiedzialny za ich organizację, nie działa zgodnie z moimi oczekiwaniami i niepoprawnie umieszcza wspomnienia w ramach poniższej struktury (źródło: `/memory/prompts.ts`)

![](https://cloud.overment.com/2024-09-15/aidevs3_mind-be1e1739-5.png)

Prośba o zapisanie linku do projektu [heyalice.app](https://heyalice.app) zakończyła się utworzeniem notatki w kategorii `resources -> documents`, a nie `resources -> websites`.  

![](https://cloud.overment.com/2024-09-15/aidevs3_categorization-40ba59c4-5.png)

Co więcej, logi LangFuse wyraźnie sugerują, że na etapie zapisywania wspomnienia, wygenerowana wiadomość użytkownika **wskazuje poprawną kategorię**! Pomimo tego, model zdecydował inaczej, co nie jest zrozumiałe. 

![](https://cloud.overment.com/2024-09-15/aidevs3_request-b5a92d3e-d.png)

Skorzystałem więc z odpowiednika OpenAI Playground dostępnego w LangFuse, aby wysłać kolejną wiadomość oznaczoną jako "System Check" z prośbą o wyjaśnienie decyzji. W odpowiedzi otrzymałem uzasadnienie, w którym model uznał kategorię `notepad` za bardziej pasującą do wskazanego zasobu. Oczywiście, ze względu na sposób działania LLM, nie mówimy tutaj o 100% pewności, że wskazany przez model powód jest tym, którego szukamy, ale możemy uznać go za wskazówkę.
 
![](https://cloud.overment.com/2024-09-15/aidevs3_ask-cce30cad-3.png)

Mamy teraz kilka opcji, które możemy wziąć pod uwagę:

- Zadać pytania pogłębiające, które mogą naprowadzić nas na kolejne problemy promptu lub nowe pomysły dotyczące jego dalszej iteracji.
- Przeanalizować prompt samodzielnie, szczególnie pod kątem brakujących danych, dwuznacznych instrukcji czy nawet kolejności zapisu poszczególnych sekcji.
- Rozbić zadanie na mniejsze kroki, uwzględniając np. wcześniejsze zastanowienie się nad organizacją wspomnień.
- Dać więcej czasu "na myślenie" przez generowanie właściwości "thinking", umieszczanej na pierwszym miejscu struktury obiektu JSON.
- Wprowadzić zmiany wspólnie z modelem.

Zobaczmy więc, jak z optymalizacją promptu może nam pomóc sam model.
## Optymalizacja z pomocą modelu

Wiemy, że model domyślnie podąża za instrukcjami zawartymi w prompcie oraz wiadomościami użytkownika. Pomimo tego możliwe jest omówienie promptu, poprzez wcześniejsze uprzedzenie modelu o tym fakcie. Może to mieć formę wiadomości widocznej poniżej lub sytuacji, w której najpierw wymieniamy z modelem kilka wstępnych informacji, a dopiero potem przechodzimy do promptu.

![](https://cloud.overment.com/2024-09-15/aidevs3_work-2f9301b7-5.png)

Gdy prompt znajduje się już w konwersacji, a model poprawnie na niego reaguje, to możemy przejść do wprowadzenia zmian poprzez opisanie problemu i zasad dalszej współpracy. Poniżej widać jak przedstawiam problem oraz sugeruję zmiany dotyczące procesu rozumowania i struktury wypowiedzi, prosząc przy tym o dodanie właściwości `_thinking`.

![](https://cloud.overment.com/2024-09-15/aidevs3_refining-07aa5f98-1.png)

W ten sposób model wygenerował mi kolejną wersję promptu. Natomiast proces optymalizacji ma charakter iteracyjny i nie wystarczyła jedna wiadomość, aby rozwiązać wszystkie problemy. Każdą z kolejnych sugestii przeglądałem od początku do końca, prosząc o kolejne poprawki **lub wprowadzałem je samodzielnie**. Następnie testowałem prompt i sprawdzałem zachowanie aplikacji.

Mówimy tutaj o dość prostym mechanizmie, z którego nie korzystają inni użytkownicy. Nie mamy więc problemu z tym, aby wprowadzać w nim nawet bardzo duże zmiany, ale nie zawsze będziemy mieć taki komfort.

Dalsze debugowanie aplikacji doprowadziło mnie do wniosku, że konieczne jest zmodyfikowanie struktury pamięci oraz uzupełnienie opisów, aby trudno było je ze sobą pomylić. Nawet wspomniana różnica pomiędzy `resources -> documents` a `resources -> websites` nie była oczywista dla modelu. W związku z tym zmieniłem nazwę `documents` na `files` i wspólnie z modelem o1-preview kilkukrotnie przeszliśmy przez nową wersję struktury pamięci. 

![](https://cloud.overment.com/2024-09-15/aidevs3_ambiguity-aa9030ed-4.png)

Nie ulega wątpliwości, że model językowy nie jest w stanie samodzielnie rozwiązać problemów związanych z działaniem promptu, szczególnie gdy nie ma punktu odniesienia w postaci zestawu danych testowych oraz feedbacku ze strony aplikacji. Jednak wartość umiejętności modelu przy współpracy z człowiekiem jest niepodważalna. 
## Kompresja promptu

To samo zdanie można wyrazić na różne sposoby, używając więcej lub mniej słów. W przypadku promptu jest to istotne z uwagi na tokeny i zarządzanie uwagą modelu. Podobnie jak przy tworzeniu promptu czy analizie jego działania, w parafrazie i kompresji instrukcji możemy korzystać z umiejętności modelu językowego. Więcej na ten temat można przeczytać w [LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models](https://arxiv.org/abs/2310.05736) lub po prostu skorzystać z omawianego w tej publikacji narzędzia [LLMLingua](https://github.com/microsoft/LLMLingua). 

W repozytorium tego projektu znajduje się poniższa grafika, obrazująca proces kompresji, polegający w dużej mierze na usunięciu słów, które nie mają znaczenia z punktu widzenia samej treści. 

![](https://cloud.overment.com/2024-09-15/aidevs3_compression-5eb423a4-d.png)

Moje doświadczenie z tym narzędziem sugeruje, że **automatyczna kompresja promptu daje umiarkowane rezultaty**, ale stanowi dobre źródło informacji na temat tego, co potencjalnie możemy usunąć. Tutaj także mamy przestrzeń do tworzenia meta promptów zdolnych do skutecznej kompresji. 

Kompresja promptów wydaje się mieć umiarkowane znaczenie, biorąc pod uwagę rosnące limity okna kontekstu czy cache'owanie promptu. Natomiast już teraz sami widzimy, że złożone modele mają problem z podążaniem za złożonymi instrukcjami, które także **szybko stają się mało zrozumiałe także dla ludzi**. 

W temacie kompresji, pod uwagę możemy brać: 

- Zastępowanie obszernych, złożonych promptów, na mniejsze, bardziej wyspecjalizowane akcje, które będą uruchamiane warunkowo, w zależności od sytuacji.
- Opisywanie wybranych zachowań modelu z pomocą pojedynczych słów bądź wyrażeń, a nie pełnych zdań. Przykładowo określenie "U**se first-principles thinking**" wskazuje na zrozumiałą dla modelu językowego koncepcję rozumowania, poprzez rozbicie zagadnienia na czynniki pierwsze.
- Zmianę języka promptu oraz kontekstu, np. z polskiego na angielski
- Usuwanie wybranych fragmentów promptu, które opisują naturalne zachowanie modelu (np. sposób formatowania wypowiedzi) i tym samym nie wnoszą nic nowego. Co więcej, takie instrukcje mogą **ograniczać model**, zmniejszając jego skuteczność

Podobnie jak w przypadku optymalizacji promptu pod kątem skuteczności, możemy przedyskutować z modelem temat kompresji. Poniższą rozmowę przeprowadziłem z modelem o1-preview, który już w pierwszej turze zwrócił mi wyczerpujący raport oraz sugestię nowej wersji promptu. 

![](https://cloud.overment.com/2024-09-15/aidevs3_optimize-22e0c2ad-b.png)

![](https://cloud.overment.com/2024-09-15/aidevs3_optimization-0c4963b9-0.png)

Większość zasugerowanych zmian była bardzo trafna i zwracała uwagę na zbyt ogólne instrukcje lub fragmenty dotyczące tych samych zachowań. Wśród sugestii pojawiły się także takie, które nie były zgodne z moimi założeniami, więc po prostu je pominąłem. Efekt pracy widać poniżej — redukcja z 2095 do 803 tokenów przy zachowaniu oczekiwanej skuteczności. 

![](https://cloud.overment.com/2024-09-15/aidevs3_uncompressed-216b3e0d-4.png)

![](https://cloud.overment.com/2024-09-15/aidevs3_compressed-77fdaf30-a.png)

Proces kompresji promptu będzie różnił się w zależności od sytuacji i nie będzie on jednorazowy. Podczas wprowadzania kolejnych modyfikacji, szybko dojdziemy do momentu w którym prompt ponownie zwiększy swoją objętość i będzie wymagał poprawy. 

## Optymalizacja wypowiedzi modelu

Koszt liczby wygenerowanych tokenów jest większy niż koszt tokenów przesłanych do modelu. Oczywiście tych drugich niemal zawsze jest zdecydowanie więcej, jednak i tak większy wpływ na ceny oraz szybkość działania aplikacji mają tokeny wyjściowe.

![](https://cloud.overment.com/2024-09-15/aidevs3_pricing-bc448bed-9.png)

Tak wygląda rozkład tokenów `input -> output` dla kilku ostatnich zapytań mojego systemu. Wypowiedź tokenu stanowi ~5% wszystkich przetworzonych tokenów. Jeśli weźmiemy pod uwagę szybkość inferencji, o której mówiliśmy w lekcji S01E03 — Limity, to od razu jasna stanie się chęć dążenia **do możliwie krótkiej i/lub precyzyjnej wypowiedzi modelu.** 

![](https://cloud.overment.com/2024-09-15/aidevs3_inputoutput-bb3f2e00-1.png)

Dobrym przykładem jest właściwość `_thinking`, która pojawia się w moich promptach jako pierwsza właściwość generowanego obiektu JSON. W ten sposób stwarzam modelowi przestrzeń na zastanowienie się nad tym, jak mają wyglądać kolejne właściwości zwracanego obiektu. 

Jeśli nasza instrukcja w tej sytuacji będzie sugerować modelowi wyłącznie "zastanowienie się", to z dużym prawdopodobieństwem otrzymamy rozbudowaną treść o wątpliwej wartości. Jednak gdy wskażemy schemat myśli lub listę pytań, na które model musi odpowiedzieć, jakość wypowiedzi znacznie wzrośnie.

![](https://cloud.overment.com/2024-09-15/aidevs3_output-a0be0809-b.png)

Powyższa instrukcja opisująca proces zastanawiania się daje świetny rezultat, ponieważ model wymienia słowa kluczowe, których obecność przyczynia się do wyższej jakości generowanych zapytań w tablicy `q` (queries).

![](https://cloud.overment.com/2024-09-15/aidevs3_reason-f7daba9b-8.png)

Styl wypowiedzi nie tylko określony jest w szablonie, ale także zastosowany w przykładach Few-Shot. Dzięki temu model faktycznie podąża za naszą instrukcją, szczególnie na początku swoich wypowiedzi. W dłuższych konwersacjach często zauważalna jest tendencja do powrotu do "naturalnego" dla modelu stylu. 

Jednym z rozwiązań tego problemu jest utrzymywanie możliwie krótkich instrukcji oraz liczby wiadomości konwersacji, które mogą być przechowywane jedynie w formie podsumowania, o czym mówiliśmy w lekcji S00E04 — Programowanie
## Fine-tuning

Zachowanie modelu może być dopasowane nie tylko poprzez instrukcje czy dostarczony kontekst, ale także proces fine-tuningu dzięki któremu możemy wyspecjalizować model w określonym zadaniu. Fine-tuning nie powinien być jednak postrzegany jako alternatywa dla sterowania modelem z pomocą promptów, ale uzupełnienie tego procesu.

Poniższy przykład "technik optymalizacji" pochodzi z nagrania [A Survey of Techniques for Maximizing LLM Performance](https://www.youtube.com/watch?v=ahnGLM-RC1Y) udostępnionego przez OpenAI. Pokazuje on dwa rodzaje optymalizacji — **zachowania** i **wiedzy**.

![](https://cloud.overment.com/2024-11-01/aidevs3_optimize-a486ea6d-5.png)

Logika aplikacji może zatem składać się zarówno z serii promptów realizowanych przez model taki jak GPT-4o, ale poszczególne etapy mogą być obsługiwane przez model wyspecjalizowany w tym zadaniu. 

W przypadku OpenAI obecnie proces fine-tuningu może być wykonany bezpośrednio w panelu [platform.openai.com](https://platform.openai.com/finetune) i nie jest to skomplikowane. Sama trudność tego zadania polega na dobraniu odpowiednich zestawów danych treningowych oraz danych testowych, a następnie samej ewaluacji modelu. Dane te nierzadko będziemy generować z pomocą modelu (do czego wcześniej potrzebne będą nam prompty) lub będziemy przetwarzać dane bezpośrednio z naszej aplikacji (przy zachowaniu polityki prywatności).

Przez podstawowy proces fine-tuningu, który możesz zrealizować już teraz, przeprowadzi Cię Jakub na poniższym filmie:  

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1025471081?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="fine-tuning-gpt4o-mini"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

## Podsumowanie

Podsumowując dzisiejszą lekcję, w projektowaniu aplikacji wykorzystujących duże modele językowe szczególnie pomocne okazują się same modele. Jednak obecnie ich możliwości nie pozwalają na w pełni autonomiczne działanie bez jakiegokolwiek nadzoru człowieka. W zamian, możemy projektować narzędzia wyspecjalizowane w konkretnych obszarach. Przez narzędzia rozumiem **prompty, serie promptów lub częściowo autonomiczne systemy łączące logikę aplikacji z modelami**.

Po tej lekcji już raczej nie ma wątpliwości jak istotną rolę pełnią instrukcje dla modelu. Jednocześnie jasne jest, że nie chodzi tutaj wyłącznie o same prompty, ale także sposób ich organizacji w kodzie, a także sam kod. Bo nawet patrząc na przykład `memory` widzimy, jak istotną rolę odgrywa sposób kontrolowania przepływu danych pomiędzy promptami, ich monitorowanie oraz automatyczne testy. 

Jeśli masz zrobić tylko jedną rzecz z tej lekcji, to zapoznaj się ze wspominanym meta promptem i po prostu zacznij z niego korzystać, a potem stopniowo zmieniaj go, dopasowując do swoich potrzeb. Bardzo dobrym pomysłem jest także przesłanie kilku zapytań do przykładu `memory` w celu zaobserwowania tego, jak zachowuje się model. Wiedza na ten temat z pewnością okaże się przydatna przy projektowaniu kolejnych narzędzi. Zachęcam więc do zapoznania się z poniższym filmem i przetestowania działania pamięci samodzielnie. 

<div style="padding:75% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1009759972?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="01_04_memory_2"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

Powodzenia!