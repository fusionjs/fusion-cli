module.exports = () => ({
  visitor: {
    StringLiteral(path) {
      if (path.node.value === 'helloworld') {
        console.log('TRIGGERING...');
        path.node.value = 'transformed_custom_babel';
      }
    },
  },
});
