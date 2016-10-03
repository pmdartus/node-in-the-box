
class EditorComponent extends Component {
  componentDidMount() {
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
  }

  render() {
    return (
      <div id="editor">Editor</div>
    );
  }
}

export default EditorComponent;
