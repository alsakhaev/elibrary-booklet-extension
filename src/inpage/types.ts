export type Ref = {
    id: string,
    main?: RefMain,
    details?: RefDetail
}

export type RefMain = {
    id: string, 
    title?: string, 
    authors?: string, 
    desc?: string
}

export type RefDetail = {
    id: string,
    authors?: string[],
    title?: string,
    pages?: string,
    issue?: string,
    year?: string,
    tom?: string,
    conf?: string,
    source?: string,
    journal?: string,
    keywords?: string[],
    abstract?: string
}