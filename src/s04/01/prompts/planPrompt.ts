export const planPrompt = (lastAction: string, lastResult: string, context: any): string => {
    const prompt = `Twoim celem jest odpowiedzieć na zadanie użytkownika. W tym celu musisz przeprowadzić analizę zdjęć. Zdjęcia mogą zawierać uszkodzenia (glitche), mogą być za ciemne, lub prześwietlone.
    Do naprawy zdjęć możesz użyć odpowiednich narzędzi: REPAIR, DARKEN, BRIGHTEN.
    
    <DOSTĘPNE_NARZĘDZIA>
    1. REPAIR - naprawia uszkodzenia na zdjęciu, np. w przypadku glitchy.
    2. DARKEN - przyciemnia zdjęcie, jeśli jest zbyt jasne.
    3. BRIGHTEN - rozjaśnia zdjęcie, jeśli jest zbyt ciemne.
    4. EXTRACTION - pobiera listę zdjęć z tekstu.
    5. ANALYZE - analizuje zdjęcie i zwraca jego opis, możliwy do interpretacji przez LLM.
    </DOSTĘPNE_NARZĘDZIA>
    
    W jednym kroku możesz użyć tylko jednego narzędzia. Po użyciu narzędzia, otrzymasz informację zwrotną, czy zdjęcie jest gotowe do dalszej analizy, czy wymaga kolejnej interwencji.
    
    <OSTATNIE_AKCJE>
    ${lastAction || 'Brak ostatniej akcji'}
    </OSTATNIE_AKCJE>
    
    <OSTATNI_WYNIK>
    ${lastResult || 'Brak ostatniego wyniku'}
    </OSTATNI_WYNIK>

    <ZASADY>
    1. Jeżeli ostatnia akcja wskazuje np. na analizę zdjęcia, a w wyniku analizy okazało się, że zdjecie jest uszkodzone i np. trzeba użyć narzędzia REPAIR, to wytypuj tą akcję jako kolejną.
    2. Jeżeli w wyniku narzędzia dostaniesz informację, że zdjęcie dostało nową nazwę lub adres, użyj tej informacji jako parametr kolejnej akcji.
    3. Jeżeli użycie po raz kolejny tego samego nie przyniosło efektu, zakończ pracę z przetwarzanym plikiem zwróć akcję 'PORAŻKA' z opisem, że nie udało się odczytać zdjęcia.
    4. W odpowiedzi w sekcji 'PARAMS' wpisz nazwę pliku, nad którym pracujesz, pomiń całą ścieżkę URL.
    </ZASADY>

    Odpowiedz w czystym formacie JSON:
    {
        "_thinking": "Tutaj wpis swój proces myślowy, dlaczego akurat wybrałeś taką akcję",
        "ACTION": "wybrana przez ciebie akcja, np. START",
        "PARAMS": "parametry akcji, np. nazwa zdjęcia, bez całej ścieżki URL",
    }

    <KONTEKST>
    ${JSON.stringify(context)}
    </KONTEKST>

    Po zakończeniu analizy wszystkich zdjęć, zakończ zadanie komendą 'KONIEC' i odpowiedz na pytanie użytkownika.
    Odpowiedz w czystym JSON. Nie dodawaj niczego więcej. Nie używaj formatu markdown. Powodzenia!
    `;

    return prompt;
}