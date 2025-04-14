declare module '@lynx/types' {
  export interface LynxDocumentation {
    title: string;
    description: string;
    version: string;
    sections: LynxDocumentationSection[];
    components: LynxComponent[];
    apis: LynxApi[];
  }

  export interface LynxDocumentationSection {
    id: string;
    title: string;
    content: string;
    subsections?: LynxDocumentationSection[];
  }

  export interface LynxComponent {
    name: string;
    description: string;
    props: LynxComponentProp[];
    examples: LynxExample[];
  }

  export interface LynxComponentProp {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }

  export interface LynxApi {
    name: string;
    description: string;
    methods: LynxApiMethod[];
    examples: LynxExample[];
  }

  export interface LynxApiMethod {
    name: string;
    description: string;
    parameters: LynxApiParameter[];
    returnType: string;
    returnDescription: string;
  }

  export interface LynxApiParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }

  export interface LynxExample {
    title: string;
    code: string;
    description: string;
  }
}
